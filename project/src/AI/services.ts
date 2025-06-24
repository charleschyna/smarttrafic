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
  TrafficIncident,
  VehicleType,
  PredictiveAnalyticsData,
  HeatmapDataPoint
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
      'deepseek/deepseek-r1-0528-qwen3-8b:free',
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
    const routeResponse = await services.calculateRoute({
      key: apiKey,
      locations: [
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
      ],
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

    // Helper function to process a single route from the TomTom response.
    const processRoute = (route: any): { routeLeg: RouteLeg; incidents: TrafficIncident[] } => {
      if (!route || !route.legs || route.legs.length === 0 || !route.summary) {
        console.error("[processRoute] Invalid or incomplete route object received:", route);
        return {
          routeLeg: {
            distanceInMeters: 0,
            travelTimeInSeconds: 0,
            trafficDelayInSeconds: 0,
            geometry: [],
            instructions: [],
          },
          incidents: [],
        };
      }

      const leg = route.legs[0];
      const routeLeg: RouteLeg = {
        distanceInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds,
        trafficDelayInSeconds: route.summary.trafficDelayInSeconds,
        geometry: (leg.points || []).map((p: { latitude: number; longitude: number }) => ({ lat: p.latitude, lng: p.longitude })).filter((p: { lat: number; lng: number; }) => p.lat != null && p.lng != null),
        instructions: (leg.instructions || []).map((inst: { message: string }) => ({ message: inst.message })), 
      };

      const incidents: TrafficIncident[] = (route.summary.trafficIncidents || []).map((incident: any) => ({
        summary: incident.properties.iconCategory,
        details: incident.properties.events[0]?.description || 'No details',
        position: {
          lat: incident.geometry.coordinates[1],
          lng: incident.geometry.coordinates[0],
        },
      }));

      return { routeLeg, incidents };
    };

    const mainTomtomRoute = routeResponse.routes[0];
    const { routeLeg: mainRoute, incidents } = processRoute(mainTomtomRoute);

    const alternativeRoutes = routeResponse.routes.slice(1).map(r => processRoute(r).routeLeg);

    console.log("[getOptimizedRoute] Processed main route:", mainRoute);
    console.log("[getOptimizedRoute] Parsed incidents:", incidents);

    const summary = `Fastest route: ${(mainRoute.distanceInMeters / 1000).toFixed(1)} km, estimated travel time is ${Math.round(mainRoute.travelTimeInSeconds / 60)} minutes.`;

    const optimizedRoute: OptimizedRoute = {
      summary: summary,
      mainRoute: mainRoute,
      alternativeRoutes: alternativeRoutes,
      incidents: incidents,
    };

    console.log("[getOptimizedRoute] Successfully created optimized route:", optimizedRoute);
    return optimizedRoute;

  } catch (error: any) {
    console.error('[getOptimizedRoute] CATCH BLOCK: An error occurred.');
    if (error.response && error.response.data) {
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

export async function getPredictiveAnalyticsData(
  centerLocation: { lat: number; lng: number },
  timeFrame: TimeFrame
): Promise<AIResponse<PredictiveAnalyticsData>> {
  try {
    console.log('[getPredictiveAnalyticsData] Starting...');

    // 1. Define key areas for heatmap analysis (can be made dynamic later)
    const keyAreas = [
      { name: 'CBD', location: { lat: -1.286389, lng: 36.817223 } },
      { name: 'Westlands', location: { lat: -1.2651, lng: 36.8018 } },
      { name: 'Upper Hill', location: { lat: -1.299, lng: 36.816 } },
      { name: 'Thika Road', location: { lat: -1.218, lng: 36.889 } },
    ];

    // 2. Generate a single, comprehensive AI prompt for all heatmap forecasts
    const heatmapPrompt = `
      You are a world-class traffic prediction AI for Nairobi, Kenya. Based on typical traffic patterns, time of day, and day of the week, generate a congestion forecast for the following key areas over three time horizons: 1 hour, 4 hours, and 24 hours.

      Key Areas:
      ${JSON.stringify(keyAreas.map(a => a.name))}

      Current Time: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}

      Your response MUST be a single, valid JSON object. Do not include any text before or after the JSON. The JSON object must have keys "oneHour", "fourHour", and "twentyFourHour". Each key should contain an array of objects, one for each area, in the following strict format:
      {
        "area": "Area Name",
        "congestion": 75, // A percentage from 0 to 100
        "trend": "up" // "up", "down", or "stable"
      }

      Example for one key:
      "oneHour": [
        { "area": "CBD", "congestion": 65, "trend": "stable" },
        { "area": "Westlands", "congestion": 72, "trend": "up" }
      ]
    `;

    const aiHeatmapResponse = await getAIChatCompletion('deepseek/deepseek-r1-0528-qwen3-8b:free', heatmapPrompt, true);
    if (!aiHeatmapResponse) {
      throw new Error('Received an empty heatmap response from the AI service.');
    }

    let parsedHeatmaps: {
      oneHour: HeatmapDataPoint[];
      fourHour: HeatmapDataPoint[];
      twentyFourHour: HeatmapDataPoint[];
    };
    try {
      parsedHeatmaps = JSON.parse(aiHeatmapResponse);
      // Basic validation
      if (!parsedHeatmaps.oneHour || !parsedHeatmaps.fourHour || !parsedHeatmaps.twentyFourHour) {
        throw new Error('Malformed heatmap data from AI.');
      }
    } catch (e) {
      console.error('Failed to parse AI heatmap response:', aiHeatmapResponse);
      throw new Error('AI returned malformed heatmap JSON.');
    }

    // 3. Get data for the trends chart
    // We need flowData for this, let's fetch it for the center location
    const flowData = await getTrafficFlowData(centerLocation, 5); // Using a 5km radius for the overall trend
    const trendsData = await getCongestionForecast(flowData, timeFrame);

    // 4. Combine into the final structure
    const analyticsData: PredictiveAnalyticsData = {
      heatmaps: parsedHeatmaps,
      trends: trendsData,
    };

    console.log('[getPredictiveAnalyticsData] Successfully generated data:', analyticsData);

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