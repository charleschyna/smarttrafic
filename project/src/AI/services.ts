import { getAIChatCompletion } from './AIService';
import type { TimeFrame } from '../components/Charts/CongestionChart';
import { services } from '@tomtom-international/web-sdk-services';
import type {
  TrafficPrediction,
  AIResponse,
  TrafficFlowData,
  CongestionForecast,
  AreaComparisonData,
  OptimizedRoute,
  RouteLeg,
  AnalyzedIncident,
  VehicleType
} from './types';

// Function to get traffic flow data from TomTom API using multi-point sampling
async function getTrafficFlowData(location: { lat: number; lng: number }, radius: number) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not defined in environment variables.');
  }

  // Generate a 3x3 grid of points for sampling
  const points = [];
  const gridDivisions = 2; // Creates a 3x3 grid
  const latRadius = radius / 111.32; // Convert radius from km to degrees latitude
  const lngRadius = radius / (111.32 * Math.cos(location.lat * Math.PI / 180)); // Convert radius from km to degrees longitude
  const latStep = latRadius * 2 / gridDivisions;
  const lngStep = lngRadius * 2 / gridDivisions;
  const startLat = location.lat - latRadius;
  const startLng = location.lng - lngRadius;

  for (let i = 0; i <= gridDivisions; i++) {
    for (let j = 0; j <= gridDivisions; j++) {
      points.push({
        lat: startLat + i * latStep,
        lng: startLng + j * lngStep,
      });
    }
  }

  const promises = points.map(point => {
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=${apiKey}&point=${point.lat},${point.lng}`;
    return fetch(url).then(response => {
      if (!response.ok) {
        console.error(`Failed to fetch traffic flow for point ${point.lat},${point.lng}: ${response.status}`);
        return null;
      }
      return response.json();
    }).catch(error => {
      console.error(`Network error for point ${point.lat},${point.lng}:`, error);
      return null;
    });
  });

  const results = await Promise.all(promises);
  const validResults = results.filter(r => r && r.flowSegmentData);

  // Log individual results to debug low average congestion
  console.log("Individual traffic flow results from sample points:", validResults);

  if (validResults.length === 0) {
    console.warn('No traffic data could be fetched for any sample points.');
    return null;
  }

  // Use a weighted average to give more importance to the central point
  const centerPointWeight = 0.4; // 40% weight to the center
  const edgePointWeight = 0.6 / (validResults.length - 1); // Remaining 60% distributed among other points

  const weightedStats = validResults.reduce((acc, result, index) => {
      const data = result.flowSegmentData;
      const isCenterPoint = (index === Math.floor(points.length / 2));
      const weight = isCenterPoint ? centerPointWeight : edgePointWeight;

      if (data.currentSpeed !== undefined && data.freeFlowSpeed !== undefined) {
          acc.totalCurrentSpeed += data.currentSpeed * weight;
          acc.totalFreeFlowSpeed += data.freeFlowSpeed * weight;
          acc.totalCurrentTravelTime += data.currentTravelTime * weight;
          acc.totalFreeFlowTravelTime += data.freeFlowTravelTime * weight;
          acc.totalWeight += weight;
      }
      return acc;
  }, { totalCurrentSpeed: 0, totalFreeFlowSpeed: 0, totalCurrentTravelTime: 0, totalFreeFlowTravelTime: 0, totalWeight: 0 });

  if (weightedStats.totalWeight === 0) {
      return null;
  }

  return {
      currentSpeed: weightedStats.totalCurrentSpeed / weightedStats.totalWeight,
      freeFlowSpeed: weightedStats.totalFreeFlowSpeed / weightedStats.totalWeight,
      currentTravelTime: weightedStats.totalCurrentTravelTime / weightedStats.totalWeight,
      freeFlowTravelTime: weightedStats.totalFreeFlowTravelTime / weightedStats.totalWeight,
      confidence: 1, // We are creating an aggregate, so confidence is high.
  };
}

/**
 * Generates a congestion forecast for the next 8 hours using AI.
 * @param flowData The current traffic flow data.
 * @returns An array of congestion forecast objects.
 */


// Function to get traffic incident data from TomTom API
async function getCongestionForecast(flowData: TrafficFlowData | null, timeFrame: TimeFrame): Promise<CongestionForecast[]> {
  if (!flowData) {
    return [];
  }

  let promptDetails = '';
  let exampleFormat = '';

  switch (timeFrame) {
    case 'week':
      promptDetails = 'predict the average daily congestion level (%) for the next 7 days.';
      exampleFormat = '[{ "hour": "Mon", "congestion": 45 }, { "hour": "Tue", "congestion": 50 }]';
      break;
    case 'month':
      promptDetails = 'predict the average weekly congestion level (%) for the next 4 weeks.';
      exampleFormat = '[{ "hour": "Week 1", "congestion": 55 }, { "hour": "Week 2", "congestion": 60 }]';
      break;
    case 'today':
    default:
      promptDetails = 'provide a 24-hour congestion overview. For past hours, use observed data. For future hours, provide a forecast. Add an `isForecast: true` flag to all forecasted hours.';
      exampleFormat = '[{ "hour": "1 AM", "congestion": 15 }, { "hour": "2 PM", "congestion": 60, "isForecast": true }]';
      break;
  }

  const prompt = `
    You are an expert traffic analyst AI for Nairobi, Kenya.
    Based on the following real-time traffic data, ${promptDetails}
    - Current Time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
    - Current Average Travel Time: ${Math.round(flowData.currentTravelTime)} seconds
    - Typical Free-Flow Travel Time: ${Math.round(flowData.freeFlowTravelTime)} seconds
    - Current Congestion Level: ${Math.round(((flowData.currentTravelTime - flowData.freeFlowTravelTime) / flowData.freeFlowTravelTime) * 100)}%

    Provide your forecast as a JSON array of objects. Each object must have two keys: "hour" (a string for the time period) and "congestion" (a number).
    The key for the time period MUST be "hour".
    Example format: ${exampleFormat}
  `;

  try {
    const aiResponse = await getAIChatCompletion('gpt-3.5-turbo', prompt, true);
    const parsedResponse = JSON.parse(aiResponse);

    // The AI sometimes wraps the array in an object, so we handle that.
    const forecastData = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.forecast || parsedResponse.analysis || [];
    

    if (Array.isArray(forecastData) && forecastData.every(item => 'hour' in item && 'congestion' in item)) {
      return forecastData;
    }

    // Handle cases where the data is nested under a different key like 'forecast'
    if (parsedResponse.forecast && Array.isArray(parsedResponse.forecast)) {
      return parsedResponse.forecast;
    }

    console.error('AI response is not in the expected format:', parsedResponse);
    return [];
  } catch (error) {
    console.error('Error generating or parsing congestion forecast:', error);
    return []; // Return empty array on error
  }
}

async function getAreaComparisonData(flowData: TrafficFlowData | null): Promise<AreaComparisonData[]> {
  if (!flowData) {
    return [];
  }

  const prompt = `
    You are an expert traffic analyst AI for Nairobi, Kenya.
    Based on the provided real-time traffic data, analyze and compare the current congestion levels across different key sub-regions of the city.
    The main regions to consider are: CBD, Westlands, Industrial Area, Upper Hill, and Kilimani.

    Provide your analysis as a JSON array of objects. Each object must have two keys: "name" (the name of the area) and "congestion" (a number representing the congestion level in that area).
    Example format: [{ "name": "CBD", "congestion": 75 }, { "name": "Westlands", "congestion": 60 }]
  `;

  try {
    const aiResponse = await getAIChatCompletion('gpt-3.5-turbo', prompt, true);
    const parsedResponse = JSON.parse(aiResponse);

    // The AI sometimes wraps the array in an object, so we handle that.
    const analysisData = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.analysis || [];


    if (Array.isArray(analysisData) && analysisData.every(item => 'name' in item && 'congestion' in item)) {
      return analysisData;
    } else {
      console.error('AI response for area comparison is not in the expected format:', parsedResponse);
      return [];
    }
  } catch (error) {
    console.error('Error generating or parsing area comparison data:', error);
    return [];
  }
}

async function getTrafficIncidentData(location: { lat: number; lng: number }, radius: number) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not defined in environment variables.');
  }
  const boundingBox = {
    minLat: location.lat - (radius / 111.32),
    maxLat: location.lat + (radius / 111.32),
    minLng: location.lng - (radius / (111.32 * Math.cos(location.lat * Math.PI / 180))),
    maxLng: location.lng + (radius / (111.32 * Math.cos(location.lat * Math.PI / 180))),
  };
  const fields = '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastReportTime,tmc{countryCode,tableNumber,tableVersion,direction,points{location,offset}}}}}';
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${boundingBox.minLng},${boundingBox.minLat},${boundingBox.maxLng},${boundingBox.maxLat}&fields=${encodeURIComponent(fields)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to fetch traffic incidents: ${response.status} ${response.statusText}`, errorBody);
    return null;
  }
  return await response.json();
}

// Generate traffic insights for a given location and radius
export async function generateTrafficInsights(
  location: { lat: number; lng: number; address?: string },
  radius: number
): Promise<AIResponse<any>> {
  try {
    // 1. Fetch REAL data from BOTH TomTom APIs.
    let flowData, incidentData;
    try {
      [flowData, incidentData] = await Promise.all([
        getTrafficFlowData(location, radius),
        getTrafficIncidentData(location, radius)
      ]);
    } catch (error) {
      console.error("Error fetching TomTom data:", error);
      // We can still proceed with partial or no data, the prompt will handle it.
    }

    // 2. Create a new, simpler and more direct prompt.
    const prompt = `You are an expert traffic analyst AI. Your task is to provide a clear and concise summary of the traffic conditions based on the provided real-time data.

Core Instructions:
1.  Analyze the Data: Base your entire report only on the data below. Do not invent information.
2.  Handle Missing Data: If a data feed is marked as 'Feed offline', you must clearly state this and explain what it means for the analysis. For example: "The incident data feed is offline, so this report is based solely on general traffic flow."
3.  Be Professional: Write in a clear, professional tone. Do not use any markdown formatting (like bolding or italics).

Real-Time Data Feeds:
*   Traffic Flow: ${JSON.stringify(flowData || 'Feed offline', null, 2)}
*   Traffic Incidents: ${JSON.stringify(incidentData || 'Feed offline', null, 2)}

Your Report:

1. Overall Summary:
(Provide a one-sentence summary of the traffic conditions.)

2. Incident Report:
(If incident data is online and contains incidents, describe them. If the feed is offline or there are no incidents, state that clearly.)

3. Traffic Flow Analysis:
(Analyze the traffic flow data, comparing current speed to free-flow speed. If the feed is offline, state that.)

4. Forecast:
(Provide a brief, one-sentence forecast based on the available data.)`;

    // 3. Get the summary from the AI.
    const aiResponse = await getAIChatCompletion('deepseek/deepseek-r1-0528-qwen3-8b:free', prompt, false);

    if (!aiResponse) {
      throw new Error('Received an empty response from the AI service.');
    }
    
    // The data is now a string summary based on real data.
    return {
      success: true,
      data: aiResponse,
    };
  } catch (error) {
    console.error('Error generating traffic insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

// Function to get aggregated data for the dashboard
export async function getDashboardData(location: { lat: number; lng: number }, radius: number, timeFrame: TimeFrame) {
  try {
    // Fetch all data concurrently
    const [flowData, incidentData] = await Promise.all([
      getTrafficFlowData(location, radius),
      getTrafficIncidentData(location, radius)
    ]);

    const congestionForecast = await getCongestionForecast(flowData, timeFrame);
    const areaComparisonData = await getAreaComparisonData(flowData);

    let congestionLevel = 0;
    // Switched to a more accurate congestion calculation based on travel time delay.
    if (flowData && flowData.currentTravelTime && flowData.freeFlowTravelTime > 0) {
        const delayPercentage = ((flowData.currentTravelTime - flowData.freeFlowTravelTime) / flowData.freeFlowTravelTime) * 100;
        congestionLevel = Math.round(delayPercentage);
    } else {
        console.warn('Could not calculate congestion level due to missing or invalid travel time data.');
    }

    // Log the raw data for debugging
    console.log('Raw flow data for congestion calculation:', {
        currentTravelTime: flowData?.currentTravelTime,
        freeFlowTravelTime: flowData?.freeFlowTravelTime,
    });

    const avgTripTime = flowData ? Math.round(flowData.currentTravelTime / 60) : 0;
    const activeIncidents = incidentData?.incidents?.length || 0;

    // Log the calculated level for debugging
    console.log('Calculated Congestion Level (% delay):', congestionLevel);

    return {
      success: true,
      data: {
        congestionLevel,
        avgTripTime,
        activeIncidents,
        incidents: incidentData?.incidents || [], // Return the full list of incidents
        freeFlowTravelTime: flowData?.freeFlowTravelTime || 0,
        congestionForecast, // Add the forecast to the payload
        areaComparisonData, // Add the area comparison data
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

/**
 * =======================================================================
 * Route Optimization Service
 * =======================================================================
 */

/**
 * Fetches route options from TomTom and uses AI to analyze and summarize them.
 * @param origin The starting coordinates.
 * @param destination The destination coordinates.
 * @param vehicle The type of vehicle (e.g., 'car', 'truck').
 * @returns An OptimizedRoute object or null if an error occurs.
 */
export async function getOptimizedRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  vehicle: VehicleType
): Promise<OptimizedRoute | null> {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    console.error('[getOptimizedRoute] TomTom API key is not configured.');
    return null;
  }

  console.log(`[getOptimizedRoute] Starting for vehicle: ${vehicle}`, { origin, destination });

  try {
    // Definitive Fix: Use an array of LngLatLike objects instead of a string.
    // This is more robust and less prone to formatting errors.
    const locations = [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ];

    const routeResponse = await services.calculateRoute({
      key: apiKey,
      locations: locations, // Pass the array directly
      travelMode: vehicle,
      maxAlternatives: 2,
      traffic: true,
      computeTravelTimeFor: 'all',
      instructionsType: 'text',
      routeType: 'fastest',
    });
    console.log("[getOptimizedRoute] TomTom API Response:", routeResponse);

    if (!routeResponse || !routeResponse.routes || routeResponse.routes.length === 0) {
      console.error("[getOptimizedRoute] No routes found by TomTom API.", routeResponse);
      return null;
    }

    const processRoute = (route: any): RouteLeg => {
      // Defensive check for a valid route structure
      if (!route || !route.legs || route.legs.length === 0 || !route.summary) {
        console.error("[processRoute] Invalid or incomplete route object received from API:", route);
        // Return a default/empty RouteLeg to prevent crashing the application
        return {
          distanceInMeters: 0,
          travelTimeInSeconds: 0,
          trafficDelayInSeconds: 0,
          geometry: [],
          instructions: [],
        };
      }

      const leg = route.legs[0];
      return {
        distanceInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds,
        trafficDelayInSeconds: route.summary.trafficDelayInSeconds,
        // Defensive check for points and instructions before mapping
        geometry: (leg.points || []).map((p: { latitude: number; longitude: number }) => ({ lat: p.latitude, lng: p.longitude })),
        instructions: (leg.instructions || []).map((inst: { message: string }) => ({ message: inst.message })),
      };
    };

    const mainTomtomRoute = routeResponse.routes[0];
    const mainRoute = processRoute(mainTomtomRoute);
    const alternativeRoutes = routeResponse.routes.slice(1).map(processRoute);
    console.log("[getOptimizedRoute] Processed main route:", mainRoute);

    const incidentsOnRoute = (mainTomtomRoute.summary as any).trafficIncidents || [];
    const incidents = incidentsOnRoute.map((incident: any) => ({
      type: incident.properties.iconCategory,
      summary: incident.properties.events[0].description,
      position: {
        lat: incident.geometry.coordinates[1],
        lng: incident.geometry.coordinates[0],
      },
    }));
    console.log("[getOptimizedRoute] Parsed incidents:", incidents);

    // Create smaller summary-only objects to send to the AI to reduce token count.
    const mainRouteForAI = {
      distanceInMeters: mainRoute.distanceInMeters,
      travelTimeInSeconds: mainRoute.travelTimeInSeconds,
      trafficDelayInSeconds: mainRoute.trafficDelayInSeconds,
    };

    const alternativeRoutesForAI = alternativeRoutes.map(r => ({
      distanceInMeters: r.distanceInMeters,
      travelTimeInSeconds: r.travelTimeInSeconds,
      trafficDelayInSeconds: r.trafficDelayInSeconds,
    }));

    // To solve the "Prompt tokens limit exceeded" error, we make the prompt extremely compact.
    // 1. Remove all unnecessary whitespace from the JSON data by removing the `null, 2` from stringify.
    // 2. Make the instructions to the AI much more concise.
    const prompt = `
      You are a traffic AI. Summarize route data. Analyze incidents.
      Data:
      Main Route: ${JSON.stringify(mainRouteForAI)}
      Alternatives: ${JSON.stringify(alternativeRoutesForAI)}
      Incidents: ${JSON.stringify(incidents)}

      Return JSON: { "summary": "string", "incidents": [{...incidents, "details": "string"}] }
      In "details", analyze the incident's impact on the driver.
    `;

    console.log("[getOptimizedRoute] Sending prompt to AI using dedicated routing key...");
    const aiResponse = await getAIChatCompletion('gpt-4-turbo', prompt, true, 'routing');
    console.log("[getOptimizedRoute] Raw AI Response:", aiResponse);

    if (!aiResponse) {
      console.error("AI service returned an empty response.");
      return null;
    }

    const parsedResponse = JSON.parse(aiResponse) as { summary: string; incidents: AnalyzedIncident[] };
    console.log("[getOptimizedRoute] Parsed AI Response:", parsedResponse);

    const optimizedRoute: OptimizedRoute = {
      aiSummary: parsedResponse.summary,
      mainRoute: mainRoute,
      alternativeRoutes: alternativeRoutes,
      incidents: parsedResponse.incidents,
    };

    console.log("[getOptimizedRoute] Successfully created optimized route:", optimizedRoute);
    return optimizedRoute;

  } catch (error: any) {
    // Definitive Fix: Enhanced error logging to show the actual API response.
    console.error("[getOptimizedRoute] CATCH BLOCK: An error occurred.");
    if (error.response) {
      // This will log the detailed error message from the TomTom API if available
      console.error("API Error Response:", error.response.data);
    } else {
      console.error("Full Error Object:", error);
    }
    return null;
  }
}

// Predict traffic conditions for a specific location
export async function predictTraffic(
  location: { lat: number; lng: number },
  radius: number
): Promise<AIResponse<TrafficPrediction>> {
  try {
    const trafficFlow = await getTrafficFlowData(location, radius);

    if (!trafficFlow) {
        console.warn('Skipping traffic prediction due to missing traffic flow data.');
        return {
            success: false,
            error: 'Could not retrieve traffic flow data to make a prediction.'
        };
    }
    
    const prompt = `You are a sophisticated traffic prediction AI. Analyze the real-time traffic data provided and predict the conditions for the next hour.
      
      Real-Time Traffic Data:
      ${JSON.stringify(trafficFlow, null, 2)}
      
      Your response MUST be a single, valid JSON object in the following strict format. Do not include any other text, just the JSON object.
      {
        "level": "low" | "medium" | "high",
        "confidence": 0.85,
        "details": "A brief explanation for your prediction, citing specific data points if possible.",
        "location": {
          "lat": ${location.lat},
          "lng": ${location.lng}
        }
      }
      Your analysis must be based solely on the provided data.`;

    const aiResponse = await getAIChatCompletion('deepseek/deepseek-r1-0528-qwen3-8b:free', prompt, true);

    if (!aiResponse) {
      throw new Error('Received an empty response from the AI service.');
    }

    // Attempt to parse the response, which should be a JSON string.
    let parsedResponse: TrafficPrediction;
    try {
        parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", aiResponse);
        throw new Error("AI returned a malformed prediction object.");
    }
    
    // Basic validation of the parsed object
    if (!parsedResponse.level || parsedResponse.confidence === undefined || !parsedResponse.details) {
      console.error("Invalid prediction format received from AI:", parsedResponse);
      throw new Error('Invalid prediction format received from AI.');
    }

    return {
      success: true,
      data: parsedResponse,
    };
  } catch (error) {
    console.error('Error predicting traffic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}