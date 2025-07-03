import { getAIChatCompletion } from './AIService';
import type { TimeFrame } from '../components/Charts/CongestionChart';
import type {
  TrafficPrediction,
  AIResponse,
  TrafficFlowData,
  CongestionForecast,
  AreaComparisonData,
  OptimizedRoute,
  RouteLeg,
  TrafficIncident,
  VehicleType,
  PredictiveAnalyticsData,
  HeatmapDataPoint,
  TomTomRoute,
  ScoredRoute
} from './types';
import { selectBestRoute } from './scoring';

// Function to get traffic flow data from TomTom API using multi-point sampling
async function getTrafficFlowData(location: { lat: number; lng: number }, radius: number) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    const errorMessage = 'TomTom API key is not configured. Please set VITE_TOMTOM_API_KEY in your .env file.';
    console.error(errorMessage);
    throw new Error(errorMessage);
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
    const url = `/api/tomtom/traffic/services/4/flowSegmentData/relative/10/json?key=${apiKey}&point=${point.lat},${point.lng}`;
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

  // Simplified to a more robust simple average to prevent calculation errors.
  const totalStats = validResults.reduce((acc, result) => {
    const data = result.flowSegmentData;
    // Ensure we have the necessary data before including it in the average.
    if (data.currentTravelTime !== undefined && data.freeFlowTravelTime !== undefined) {
      acc.totalCurrentSpeed += data.currentSpeed || 0;
      acc.totalFreeFlowSpeed += data.freeFlowSpeed || 0;
      acc.totalCurrentTravelTime += data.currentTravelTime;
      acc.totalFreeFlowTravelTime += data.freeFlowTravelTime;
      acc.count++;
    }
    return acc;
  }, { totalCurrentSpeed: 0, totalFreeFlowSpeed: 0, totalCurrentTravelTime: 0, totalFreeFlowTravelTime: 0, count: 0 });

  if (totalStats.count === 0) {
    return null;
  }

  return {
    currentSpeed: totalStats.totalCurrentSpeed / totalStats.count,
    freeFlowSpeed: totalStats.totalFreeFlowSpeed / totalStats.count,
    currentTravelTime: totalStats.totalCurrentTravelTime / totalStats.count,
    freeFlowTravelTime: totalStats.totalFreeFlowTravelTime / totalStats.count,
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
    const aiResponse = await getAIChatCompletion('deepseek/deepseek-chat', prompt, true);
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
    const aiResponse = await getAIChatCompletion('deepseek/deepseek-chat', prompt, true);
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
  const url = `/api/tomtom/traffic/services/5/incidentDetails?bbox=${boundingBox.minLng},${boundingBox.minLat},${boundingBox.maxLng},${boundingBox.maxLat}&fields=${encodeURIComponent(fields)}&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.error && errorData.error.code === 'MAP_MATCHING_FAILURE') {
      throw new Error(`Map matching failure: ${errorData.error.description}`);
    } else {
      throw errorData;
    }
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

    // 2. Get current date and time for the report
    const now = new Date();
    const reportTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const reportDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 3. Create a new, detailed prompt for a comprehensive report.

    
    const prompt = `
      You are a world-class traffic analysis AI. Your task is to generate a detailed, real-time traffic report for a specific location.

      **Report Context:**
      - **Location:** ${location.address || 'Not specified'}
      - **Area Radius:** ${radius} km
      - **Date:** ${reportDate}
      - **Time of Report:** ${reportTime}

      **Instructions:**
      1.  **Analyze Real-Time Data:** Base your entire report *only* on the data provided below. Do not use outside knowledge or invent information.
      2.  **Structure and Formatting:** Generate the report using Markdown for clear, readable formatting. Use headings, bullet points, and bold text as appropriate.
      3.  **Handle Missing Data:** If a data feed is marked as 'Feed offline', you must clearly state this and explain its impact on the report's accuracy. For example: "The incident data feed is offline, so this report is based solely on general traffic flow and may not include specific blockages."
      4.  **Be Detailed and Practical:** Provide actionable insights. Instead of just stating numbers, explain what they mean for a driver.

      **Real-Time Data Feeds:**
      - **Traffic Flow Data:** ${JSON.stringify(flowData || 'Feed offline', null, 2)}
      - **Traffic Incidents Data:** ${JSON.stringify(
        incidentData || 'Feed offline',
        null,
        2
      )}

      ---

      **Your Generated Traffic Report:**

      ### **Traffic Report: ${location.address || 'Selected Area'}**
      *Generated on ${reportDate} at ${reportTime}*

      #### **1. Executive Summary**
      (Provide a 2-3 sentence summary of the overall traffic situation. Mention the congestion level and any major incidents.)

      #### **2. Current Traffic Flow Analysis**
      (Analyze the traffic flow data. Compare the average current speed to the free-flow speed and describe the congestion level in simple terms (e.g., "light," "moderate," "heavy"). **Strictly do not include any mathematical formulas or raw calculations.** Instead, provide a "Travel Time Impact" analysis. For example: "This level of congestion will likely add an extra 5-10 minutes to a typical 15-minute journey through this area.")

      #### **3. Active Incidents Report**
      (Analyze the 'Traffic Incidents Data'.
      - List each significant incident from the data. For each incident, provide:
        - **Description:** From the 'description' field.
        - **Severity:** From the 'magnitudeOfDelay' field (e.g., Major, Minor).
        - **Impact:** Briefly explain the likely impact on traffic.
      - If the data is offline or there are no incidents, state: "No major incidents reported in this area.")

      #### **4. Short-Term Forecast (Next 1-2 Hours)**
      (Based on the current data and time of day, provide a brief forecast. For example: "Congestion is expected to worsen as the evening rush hour begins." or "Traffic should begin to ease within the next hour.")

      #### **5. Recommendations for Drivers**
      (Provide 1-2 actionable recommendations. For example: "Drivers are advised to use alternative routes to avoid the incident on Main St." or "Consider delaying travel by 30 minutes to avoid the worst of the congestion.")
    `;

    // 4. Get the summary from the AI.
    const aiResponse = await getAIChatCompletion(
      'deepseek/deepseek-chat',
      prompt,
      false
    );

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

// Uses AI to generate a percentage comparison against the previous week for key metrics.
async function getHistoricalComparison(congestionLevel: number, avgTripTime: number, activeIncidents: number) {
  // If we have no data, don't bother calling the AI.
  if (congestionLevel === 0 && avgTripTime === 0 && activeIncidents === 0) {
    console.warn('[getHistoricalComparison] No data available to generate comparison. Returning default.');
    return {
      congestionTrend: { value: 0, isPositive: false },
      avgTripTimeTrend: { value: 0, isPositive: false },
      activeIncidentsTrend: { value: 0, isPositive: false },
    };
  }
  const prompt = `Given the current city congestion level is ${congestionLevel}%, the average trip time is ${avgTripTime} minutes, and there are ${activeIncidents} active incidents, provide a percentage comparison for each of these metrics against the typical data for the same time last week.
  Return ONLY a valid JSON object with keys 'congestionTrend', 'avgTripTimeTrend', 'activeIncidentsTrend'.
  Each key's value should be an object with two properties:
  1. 'value' (number): The percentage change. Use a positive number for an increase and a negative number for a decrease. For example, a 10% decrease is -10.
  2. 'isPositive' (boolean): This should be true if the change is an improvement (e.g., less congestion, lower travel time, fewer incidents) and false otherwise.
  For example: { "congestionTrend": { "value": -10, "isPositive": true }, "avgTripTimeTrend": { "value": -15, "isPositive": true }, "activeIncidentsTrend": { "value": 20, "isPositive": false } }`;

  try {
    const response = await getAIChatCompletion('openai/gpt-3.5-turbo', prompt, true);
    const jsonResponse = JSON.parse(response);

    // Basic validation
    if (jsonResponse.congestionTrend && jsonResponse.avgTripTimeTrend && jsonResponse.activeIncidentsTrend) {
      return { success: true, data: jsonResponse };
    } else {
      throw new Error("Invalid JSON structure from AI response.");
    }
  } catch (error) {
    console.error('[getHistoricalComparison] Error:', error);
    // Provide a default/fallback structure on error to prevent UI crashes
    return {
      success: false,
      data: {
        congestionTrend: { value: 0, isPositive: false },
        avgTripTimeTrend: { value: 0, isPositive: false },
        activeIncidentsTrend: { value: 0, isPositive: false },
      },
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

    const avgTripTime = flowData ? Math.round(flowData.currentTravelTime / 60) : 0;
    const activeIncidents = incidentData?.incidents?.length || 0;

    // Get historical comparison
    const historicalComparison = await getHistoricalComparison(
      congestionLevel,
      avgTripTime,
      activeIncidents
    );

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
        trends: historicalComparison.data, // Add the new trend data
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
  vehicle: VehicleType,
  avoid: string[] = [],
  options: { avoidTolls?: boolean; avoidHighways?: boolean } = {}
): Promise<OptimizedRoute | null> {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    const errorMessage = 'TomTom API key is not configured for getOptimizedRoute. Please set VITE_TOMTOM_API_KEY in your .env file.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  console.log(`[getOptimizedRoute] Starting for vehicle: ${vehicle}`, { origin, destination, options });
  
  console.log('[getOptimizedRoute] API Key check:', {
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyStart: apiKey?.substring(0, 8) || 'undefined'
  });
  
  if (!apiKey) {
    console.error('[getOptimizedRoute] TomTom API key is not configured.');
    console.error('[getOptimizedRoute] Make sure VITE_TOMTOM_API_KEY is set in your .env file');
    return null;
  }

  console.log(`[getOptimizedRoute] Starting for vehicle: ${vehicle}`, { origin, destination, options });

  // Helper function to process a single route from the TomTom response.
  const processRoute = (route: any): { routeLeg: RouteLeg; incidents: TrafficIncident[] } | null => {
    if (!route || !route.summary || !route.legs || route.legs.length === 0) {
      console.warn('[processRoute] Invalid or incomplete route object received:', route);
      return null;
    }

    const leg = route.legs[0];
    
    if (!leg.points || !leg.instructions) {
        console.warn('[processRoute] Route leg is missing points or instructions:', leg);
        return null;
    }

    const geometry = leg.points.map((p: { latitude: number; longitude: number }) => ({
      lat: p.latitude,
      lng: p.longitude
    }));
    
    const instructions = leg.instructions.map((inst: any) => ({
      message: inst.message || 'Instruction not available'
    }));

    const routeLeg: RouteLeg = {
      distanceInMeters: route.summary.lengthInMeters || 0,
      travelTimeInSeconds: route.summary.travelTimeInSeconds || 0,
      trafficDelayInSeconds: route.summary.trafficDelayInSeconds || 0,
      geometry: geometry,
      instructions: instructions,
    };

    const incidents: TrafficIncident[] = route.summary?.trafficIncidents || [];
    
    return { routeLeg, incidents };
  };

  try {
    // Enhanced coordinate validation
    const validateCoordinate = (coord: number, name: string, type: 'latitude' | 'longitude') => {
      if (typeof coord !== 'number' || isNaN(coord)) {
        console.error(`[getOptimizedRoute] ${name} ${type} is invalid:`, coord);
        return false;
      }
      if (type === 'latitude' && (coord < -90 || coord > 90)) {
        console.error(`[getOptimizedRoute] ${name} latitude out of range:`, coord);
        return false;
      }
      if (type === 'longitude' && (coord < -180 || coord > 180)) {
        console.error(`[getOptimizedRoute] ${name} longitude out of range:`, coord);
        return false;
      }
      return true;
    };

    if (
      !validateCoordinate(origin.lat, 'Origin', 'latitude') ||
      !validateCoordinate(origin.lng, 'Origin', 'longitude') ||
      !validateCoordinate(destination.lat, 'Destination', 'latitude') ||
      !validateCoordinate(destination.lng, 'Destination', 'longitude')
    ) {
      return null;
    }

    // Fetch multiple route types in parallel
    const routeTypes = ['fastest', 'shortest', 'eco'];
    const routePromises = routeTypes.map(async (routeType) => {
      try {
        const travelMode = vehicle === 'bicycle' ? 'bicycle' : vehicle === 'pedestrian' ? 'pedestrian' : 'car';
        const avoidParams = avoid.length > 0 ? `&avoid=${avoid.join(',')}` : '';
        const baseUrl = `/api/tomtom/routing/1/calculateRoute`;
        const locations = `${origin.lng},${origin.lat}:${destination.lng},${destination.lat}`;
        const url = `${baseUrl}/${locations}/json?key=${apiKey}&routeType=${routeType}&traffic=true&computeBestOrder=true&routeRepresentation=polyline&instructionsType=text&sectionType=traffic&travelMode=${travelMode}${avoidParams}`;

        console.log(`[getOptimizedRoute] Fetching URL: ${url}`); // Log the exact URL

        const response = await fetch(url);

        if (!response.ok) {
          throw await response.json();
        }

        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
          console.warn(`[getOptimizedRoute] No routes returned for ${routeType}`);
          return { type: routeType, response: null };
        }
        return { type: routeType, response: data };
      } catch (error) {
        console.error(`[getOptimizedRoute] API call failed for ${routeType}:`, error);
        return { type: routeType, response: null, error }; // Propagate error
      }
    });

    const results = await Promise.all(routePromises);
    const successfulResponses = results.filter((result) => result.response && result.response.routes && result.response.routes.length > 0);

    if (successfulResponses.length === 0) {
      const firstErrorResult = results.find((r: any) => r.error);
      if (firstErrorResult && firstErrorResult.error) {
        const error = firstErrorResult.error as any;
        const description = error?.error?.description || error?.detailedError?.message || 'An unknown API error occurred.';

        // Check for the failure string in the description, as the code is not reliable
        if (description.includes('MAP_MATCHING_FAILURE')) {
          const pointType = description.includes('Origin') ? 'starting point' : 'destination';
          throw new Error(`Could not find a road for the selected ${pointType}. Please choose a point closer to a main road.`);
        }

        // Handle generic network failures
        if (String(error).includes('Failed to fetch')) {
          throw new Error(
            'Failed to fetch route from TomTom. This is often a network issue. Please check:\n' +
            '1. Your internet connection.\n' +
            '2. If a browser extension (like an ad-blocker) is blocking the request.\n' +
            '3. The browser console for any CORS policy errors.'
          );
        }

        throw new Error(`Failed to fetch route from TomTom. First error: ${description}`);
      }
      console.warn('[getOptimizedRoute] No valid routes found from any type.');
      return null;
    }

    const allRoutes: TomTomRoute[] = successfulResponses.flatMap((r) => r.response.routes);
    const userPreference = 'Balanced'; // Or pass from options
    const bestRouteResult = selectBestRoute(allRoutes, userPreference);

    if (!bestRouteResult) {
      console.warn('[getOptimizedRoute] Could not determine the best route.');
      return null;
    }

    const mainRouteProcessed = processRoute(bestRouteResult.route);
    if (!mainRouteProcessed) {
      console.error('[getOptimizedRoute] Failed to process the main route.');
      return null;
    }
    const { routeLeg: mainRoute, incidents } = mainRouteProcessed;

    const aiSummary = await generateRouteSummary(bestRouteResult, userPreference, incidents);

    const alternativeRoutes = allRoutes
      .filter((routeData) => routeData !== bestRouteResult.route)
      .map((routeData) => {
        const processed = processRoute(routeData);
        return processed ? processed.routeLeg : null;
      })
      .filter((leg): leg is RouteLeg => leg !== null);

    return {
      summary: `Best route selected based on a ${userPreference} preference.`,
      aiSummary,
      mainRoute,
      alternativeRoutes,
      incidents,
    };
  } catch (error) {
    console.error('Error in getOptimizedRoute:', error);
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
        error: 'Could not retrieve traffic flow data to make a prediction.',
      };
    }

    const prompt = `You are a sophisticated traffic prediction AI. Analyze the real-time traffic data provided and predict the conditions for the next hour.
      
      Real-Time Traffic Data:
      ${JSON.stringify(trafficFlow, null, 2)}

      Based on this data, provide a prediction in a valid JSON format. The JSON object should have three keys:
      1. "level" (string): A descriptive level of congestion (e.g., "Low", "Moderate", "High", "Severe").
      2. "confidence" (number): A confidence score for your prediction, from 0.0 to 1.0.
      3. "details" (string): A short sentence explaining your reasoning.

      Example: { "level": "Moderate", "confidence": 0.85, "details": "Traffic is building up due to evening rush hour." }
    `;

    const aiResponse = await getAIChatCompletion(
      'openai/gpt-3.5-turbo',
      prompt,
      true
    );

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

/**
 * Fetches and processes all data needed for the Predictive Analytics page.
 * @param centerLocation The central location for the overall trend analysis.
 * @param timeFrame The time frame for the congestion trend chart.
 * @returns A complete dataset for the analytics page.
 */
// Define the shape of the contact form data
interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Mocks submitting a contact form.
 * In a real application, this would send data to a backend API.
 * @param formData The data from the contact form.
 * @returns A promise that resolves to a success status.
 */
export const submitContactForm = async (
  formData: ContactFormData
): Promise<{ success: boolean; error?: string }> => {
  console.log('Simulating contact form submission with data:', formData);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Always return success for now
  return { success: true };
};

/**
 * Generates a natural language summary for a given route using AI.
 * @param route - The selected best route object, including score and confidence.
 * @param preference - The user's routing preference (e.g., 'Balanced', 'Fastest').
 * @returns A string containing the AI-generated summary.
 */
export async function generateRouteSummary(
  scoredRoute: ScoredRoute,
  preference: string,
  incidents: TrafficIncident[]
): Promise<string> {
  const { summary, legs } = scoredRoute.route;
  const distance = (summary.lengthInMeters / 1000).toFixed(1);
  const time = Math.round(summary.travelTimeInSeconds / 60);
  const trafficDelay = Math.round(summary.trafficDelayInSeconds / 60);

  // Correctly extract turn-by-turn instructions from legs
  const instructions = legs
    ?.flatMap((leg) => leg.instructions?.map((instr) => instr.message))
    .filter(Boolean) // Filter out any empty or null instructions
    .slice(0, 15) // Limit to first 15 for context
    .join(' -> ');

  // Create a more descriptive summary of traffic incidents
  const trafficIncidentsSummary = incidents && incidents.length > 0
    ? incidents.map(incident => {
        const props = incident.properties;
        const delayMinutes = Math.round(props.delay / 60);
        return `${props.iconCategory} on ${props.from} (approx. ${delayMinutes} min delay)`;
      }).join('; ')
    : 'No significant traffic incidents reported on this route.';

  const prompt = `
    You are an expert driving assistant AI. Your goal is to provide a clear, conversational, and helpful summary of a driving route.
    The user's routing preference was "${preference}".

    Here is the detailed route information:
    - Total Distance: ${distance} km
    - Estimated Time: ${time} minutes (including a traffic delay of ${trafficDelay} minutes)

    Key Turns (for context, not to be listed verbatim):
    - ${instructions || 'No detailed instructions available.'}

    Live Traffic Conditions:
    - ${trafficIncidentsSummary}

    Based on all this information, generate a clear and helpful summary for the driver.
    1. Start with a friendly opening.
    2. Provide a high-level overview of the route, mentioning 2-3 key road names or turns from the key turns provided.
    3. Weave in the traffic information naturally. For example, "Watch out for a jam on Thika Road which might add about 5 minutes to your trip."
    4. Conclude with a friendly and encouraging sign-off like "Drive safe!"
    5. IMPORTANT: Do not just list the instructions. Create a short, easy-to-read narrative summary of 4-6 sentences.
  `;

  try {
    const summaryText = await getAIChatCompletion(
      'deepseek/deepseek-chat',
      prompt,
      false,
      'routing'
    );
    return summaryText;
  } catch (error) {
    console.error('Error generating AI route summary:', error);
    return 'Could not generate AI summary at this time.';
  }
}

export async function getPredictiveAnalyticsData(
  centerLocation: { lat: number; lng: number },
  timeFrame: TimeFrame
): Promise<AIResponse<PredictiveAnalyticsData>> {
  try {
    const keyAreas = [
      { name: 'CBD', location: { lat: -1.286389, lng: 36.817223 } },
      { name: 'Westlands', location: { lat: -1.2651, lng: 36.8018 } },
      { name: 'Upper Hill', location: { lat: -1.299, lng: 36.816 } },
      { name: 'Thika Road', location: { lat: -1.218, lng: 36.889 } },
    ];

    const heatmapPrompt = `
      You are a predictive traffic analysis AI for Nairobi, Kenya.
      Your task is to generate a predictive traffic heatmap based on the provided location and time frame.
      Analyze historical and real-time data to forecast congestion levels.

      Location of Interest: ${JSON.stringify(keyAreas.map(a => a.name))}
      Time Frame: ${timeFrame}

      Generate a JSON array of heatmap data points with the following structure:
      [{"lat": <latitude>, "lng": <longitude>, "weight": <congestion_level>}, ...]

      - lat/lng: Coordinates of a point within the area.
      - weight: A value from 0 (no traffic) to 1 (heavy congestion).

      Generate at least 50-100 data points covering the key areas and surrounding roads.
      Focus on major arteries and known choke points.
      The data should reflect typical traffic patterns for the specified time frame in Nairobi (e.g., rush hour, off-peak).
    `;

    const aiHeatmapResponse = await getAIChatCompletion(
      'deepseek/deepseek-chat',
      heatmapPrompt,
      true,
      'routing'
    );

    let parsedHeatmaps: HeatmapDataPoint[];
    try {
      parsedHeatmaps = JSON.parse(aiHeatmapResponse);
      if (!Array.isArray(parsedHeatmaps) || parsedHeatmaps.some(p => p.lat == null || p.lng == null || p.weight == null)) {
        throw new Error('Invalid heatmap data structure received from AI.');
      }
    } catch (e) {
      console.error('Failed to parse AI heatmap response:', aiHeatmapResponse);
      throw new Error('AI returned malformed heatmap JSON.');
    }

    const flowData = await getTrafficFlowData(centerLocation, 5);
    const trendsData = await getCongestionForecast(flowData, timeFrame);

    const analyticsData: PredictiveAnalyticsData = {
      heatmaps: {
        oneHour: parsedHeatmaps, // Simplified for now
        fourHour: [],
        twentyFourHour: [],
      },
      trends: trendsData,
    };

    return {
      success: true,
      data: analyticsData,
    };

  } catch (error) {
    console.error('[getPredictiveAnalyticsData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}