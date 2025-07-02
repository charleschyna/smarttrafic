import { getAIChatCompletion } from './AIService';
import type { TimeFrame } from '../components/Charts/CongestionChart';
import { services } from '@tomtom-international/web-sdk-services';
import { decodePolyline, simplifyRoute } from '../utils/polylineDecoder';
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
  options: { avoidTolls?: boolean; avoidHighways?: boolean } = {}
): Promise<OptimizedRoute | null> {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  
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
  const processRoute = (route: any, fallbackOrigin: { lat: number; lng: number }, fallbackDestination: { lat: number; lng: number }): { routeLeg: RouteLeg; incidents: TrafficIncident[] } => {
    console.log('[processRoute] Processing route:', route);
    
    if (!route || !route.summary) {
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

    // Extract geometry from different possible locations in the TomTom response
    let geometry: { lat: number; lng: number }[] = [];
    
    console.log('[processRoute] Route structure keys:', Object.keys(route));
    
    // Method 1: Check for guidance instructions with point coordinates
    if (route.guidance && route.guidance.instructions) {
      console.log('[processRoute] Found guidance instructions:', route.guidance.instructions.length);
      const allPoints: { lat: number; lng: number }[] = [];
      
      route.guidance.instructions.forEach((instruction: any, index: number) => {
        console.log(`[processRoute] Instruction ${index}:`, instruction);
        if (instruction.point) {
          allPoints.push({
            lat: instruction.point.latitude,
            lng: instruction.point.longitude
          });
        }
      });
      
      if (allPoints.length > 0) {
        geometry = allPoints;
        console.log('[processRoute] Extracted geometry from guidance instructions:', geometry.length, 'points');
      }
    }
    
    // Method 2: Check for route legs with detailed points
    if (geometry.length === 0 && route.legs && route.legs.length > 0) {
      console.log('[processRoute] Checking legs for points, legs count:', route.legs.length);
      const leg = route.legs[0];
      console.log('[processRoute] First leg keys:', Object.keys(leg));
      
      if (leg.points && leg.points.length > 0) {
        console.log('[processRoute] Found leg points:', leg.points.length);
        geometry = leg.points.map((p: { latitude: number; longitude: number }) => ({
          lat: p.latitude,
          lng: p.longitude
        })).filter((p: { lat: number; lng: number }) => p.lat != null && p.lng != null);
        console.log('[processRoute] Extracted geometry from leg points:', geometry.length, 'points');
      }
    }
    
    // Method 3: Check for route sections (TomTom often uses this)
    if (geometry.length === 0 && route.sections && route.sections.length > 0) {
      console.log('[processRoute] Checking sections for geometry, sections count:', route.sections.length);
      const allSectionPoints: { lat: number; lng: number }[] = [];
      
      route.sections.forEach((section: any, sectionIndex: number) => {
        console.log(`[processRoute] Section ${sectionIndex} keys:`, Object.keys(section));
        
        // Method 3a: Decode polyline from section
        if (section.polyline) {
          console.log(`[processRoute] Section ${sectionIndex} has polyline:`, section.polyline.substring(0, 100) + '...');
          try {
            const decodedPoints = decodePolyline(section.polyline);
            if (decodedPoints.length > 0) {
              console.log(`[processRoute] Successfully decoded ${decodedPoints.length} points from section ${sectionIndex} polyline`);
              // Simplify the route to avoid too many points
              const simplifiedPoints = simplifyRoute(decodedPoints, 2);
              allSectionPoints.push(...simplifiedPoints);
            }
          } catch (error) {
            console.error(`[processRoute] Failed to decode polyline for section ${sectionIndex}:`, error);
          }
        }
        
        // Method 3b: Check for points array in section
        if (section.points && section.points.length > 0) {
          console.log(`[processRoute] Section ${sectionIndex} has ${section.points.length} points`);
          section.points.forEach((p: any) => {
            if (p.latitude !== undefined && p.longitude !== undefined) {
              allSectionPoints.push({
                lat: p.latitude,
                lng: p.longitude
              });
            }
          });
        }
      });
      
      if (allSectionPoints.length > 0) {
        geometry = allSectionPoints;
        console.log('[processRoute] Extracted geometry from sections:', geometry.length, 'points');
      }
    }
    
    // Method 3c: Check for top-level polyline in route
    if (geometry.length === 0 && route.polyline) {
      console.log('[processRoute] Found top-level polyline:', route.polyline.substring(0, 100) + '...');
      try {
        const decodedPoints = decodePolyline(route.polyline);
        if (decodedPoints.length > 0) {
          console.log(`[processRoute] Successfully decoded ${decodedPoints.length} points from top-level polyline`);
          // Simplify the route to avoid too many points
          geometry = simplifyRoute(decodedPoints, 2);
          console.log('[processRoute] Extracted geometry from top-level polyline:', geometry.length, 'points');
        }
      } catch (error) {
        console.error('[processRoute] Failed to decode top-level polyline:', error);
      }
    }
    
    // Method 4: Check the summary for start/end points and create intermediate points
    if (geometry.length === 0 && route.summary) {
      console.log('[processRoute] Checking summary for departure/arrival points');
      
      if (route.summary.departureLocation && route.summary.arrivalLocation) {
        const depLoc = route.summary.departureLocation;
        const arrLoc = route.summary.arrivalLocation;
        
        console.log('[processRoute] Found departure/arrival locations:', { depLoc, arrLoc });
        
        // Create a simple path with start and end points
        geometry = [
          { lat: depLoc.latitude, lng: depLoc.longitude },
          { lat: arrLoc.latitude, lng: arrLoc.longitude }
        ];
        
        console.log('[processRoute] Created basic geometry from summary locations:', geometry.length, 'points');
      }
    }
    
    // Enhanced fallback: Create detailed geometry by interpolating between waypoints
    if (geometry.length === 0) {
      console.warn('[processRoute] No detailed geometry found, creating interpolated path');
      
      // Try to extract waypoints from instructions for more realistic routing
      let waypoints = [];
      
      if (route.guidance && route.guidance.instructions) {
        console.log('[processRoute] Extracting waypoints from guidance instructions');
        waypoints = route.guidance.instructions
          .filter((inst: any) => inst.point)
          .map((inst: any) => ({
            lat: inst.point.latitude,
            lng: inst.point.longitude
          }));
        console.log('[processRoute] Found', waypoints.length, 'waypoints from instructions');
      }
      
      // If no waypoints from instructions, create intermediate points
      if (waypoints.length === 0) {
        console.log('[processRoute] Creating interpolated waypoints between origin and destination');
        const steps = 10; // Create 10 intermediate points for smoother curve
        waypoints = [];
        
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          const lat = fallbackOrigin.lat + (fallbackDestination.lat - fallbackOrigin.lat) * ratio;
          const lng = fallbackOrigin.lng + (fallbackDestination.lng - fallbackOrigin.lng) * ratio;
          
          // Add slight randomness to avoid perfectly straight line (simulate road curves)
          const randomOffset = 0.001; // Small offset for more realistic path
          const offsetLat = lat + (Math.random() - 0.5) * randomOffset;
          const offsetLng = lng + (Math.random() - 0.5) * randomOffset;
          
          waypoints.push({ lat: offsetLat, lng: offsetLng });
        }
        console.log('[processRoute] Created', waypoints.length, 'interpolated waypoints');
      }
      
      // Ensure we always have start and end points
      if (waypoints.length === 0 || 
          (waypoints[0].lat !== fallbackOrigin.lat || waypoints[0].lng !== fallbackOrigin.lng)) {
        waypoints.unshift({ lat: fallbackOrigin.lat, lng: fallbackOrigin.lng });
      }
      
      if (waypoints.length === 0 || 
          (waypoints[waypoints.length - 1].lat !== fallbackDestination.lat || 
           waypoints[waypoints.length - 1].lng !== fallbackDestination.lng)) {
        waypoints.push({ lat: fallbackDestination.lat, lng: fallbackDestination.lng });
      }
      
      geometry = waypoints;
      console.log('[processRoute] Final geometry with', geometry.length, 'points:', geometry.slice(0, 3), '...', geometry.slice(-3));
    }
    
    // Extract instructions
    let instructions: { message: string }[] = [];
    if (route.guidance && route.guidance.instructions) {
      instructions = route.guidance.instructions.map((inst: any) => ({
        message: inst.message || inst.instruction || 'Turn instruction'
      }));
    } else if (route.legs && route.legs[0] && route.legs[0].instructions) {
      instructions = route.legs[0].instructions.map((inst: any) => ({
        message: inst.message || inst.instruction || 'Turn instruction'
      }));
    }

    const routeLeg: RouteLeg = {
      distanceInMeters: route.summary.lengthInMeters || 0,
      travelTimeInSeconds: route.summary.travelTimeInSeconds || 0,
      trafficDelayInSeconds: route.summary.trafficDelayInSeconds || 0,
      geometry: geometry,
      instructions: instructions,
    };
    
    console.log('[processRoute] Created routeLeg:', {
      distanceInMeters: routeLeg.distanceInMeters,
      travelTimeInSeconds: routeLeg.travelTimeInSeconds,
      trafficDelayInSeconds: routeLeg.trafficDelayInSeconds,
      geometryPoints: routeLeg.geometry.length,
      instructionsCount: routeLeg.instructions.length
    });

    // Extract traffic incidents
    const incidents: TrafficIncident[] = [];
    if (route.summary && route.summary.trafficIncidents) {
      route.summary.trafficIncidents.forEach((incident: any) => {
        try {
          incidents.push({
            summary: incident.properties?.iconCategory || 'Traffic incident',
            details: incident.properties?.events?.[0]?.description || 'No details available',
            position: {
              lat: incident.geometry?.coordinates?.[1] || 0,
              lng: incident.geometry?.coordinates?.[0] || 0,
            },
          });
        } catch (err) {
          console.warn('[processRoute] Failed to process incident:', incident, err);
        }
      });
    }

    return { routeLeg, incidents };
  };

  try {
    // Enhanced coordinate validation
    const validateCoordinate = (coord, name, type) => {
      if (typeof coord !== 'number') {
        console.error(`[getOptimizedRoute] ${name} ${type} is not a number:`, coord, typeof coord);
        return false;
      }
      if (isNaN(coord)) {
        console.error(`[getOptimizedRoute] ${name} ${type} is NaN:`, coord);
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

    if (!validateCoordinate(origin.lat, 'Origin', 'latitude') ||
        !validateCoordinate(origin.lng, 'Origin', 'longitude') ||
        !validateCoordinate(destination.lat, 'Destination', 'latitude') ||
        !validateCoordinate(destination.lng, 'Destination', 'longitude')) {
      console.error('[getOptimizedRoute] Invalid coordinates provided:', { origin, destination });
      return null;
    }

    // Build avoid parameters based on options
    const avoid = [];
    if (options.avoidTolls) avoid.push('tollRoads');
    if (options.avoidHighways) avoid.push('motorways');

    // Use direct TomTom Routing API to get detailed road geometry
    const routeTypes = ['fastest', 'shortest', 'eco'];
    const routePromises = routeTypes.map(async (routeType) => {
      try {
        console.log(`[getOptimizedRoute] Calculating ${routeType} route using direct TomTom API...`);
        
        // Map vehicle types correctly
        const travelMode = vehicle === 'bicycle' ? 'bicycle' : vehicle === 'pedestrian' ? 'pedestrian' : 'car';
        
        // Build avoid parameters
        const avoidParams = avoid.length > 0 ? `&avoid=${avoid.join(',')}` : '';
        
        // Construct the TomTom Routing API URL with proper parameters for geometry
        const baseUrl = 'https://api.tomtom.com/routing/1/calculateRoute';
        const locations = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
        
        // Build URL parameters properly to force detailed geometry
        const urlParams = new URLSearchParams({
          key: apiKey,
          travelMode: travelMode,
          routeType: routeType,
          traffic: 'true',
          computeTravelTimeFor: 'all',
          instructionsType: 'text',
          computeBestOrder: 'false',
          language: 'en-GB',
          // Force detailed route geometry
          guidance: 'true',
          routeRepresentation: 'polyline',
          sectionType: 'traffic',
          report: 'effectiveSettings'
        });
        
        // Add avoid parameters if they exist
        if (avoid.length > 0) {
          urlParams.append('avoid', avoid.join(','));
        }
        
        const url = `${baseUrl}/${locations}/json?${urlParams.toString()}`;
        
        console.log(`[getOptimizedRoute] Direct API URL for ${routeType}:`);
        console.log(url);
        
        const response = await fetch(url);
        
        console.log(`[getOptimizedRoute] Response status for ${routeType}: ${response.status}`);
        console.log(`[getOptimizedRoute] Response headers for ${routeType}:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[getOptimizedRoute] HTTP ${response.status} for ${routeType}:`, errorText);
          
          // Check for specific TomTom API errors
          if (response.status === 403) {
            console.error('[getOptimizedRoute] API Key authentication failed - check VITE_TOMTOM_API_KEY');
          } else if (response.status === 400) {
            console.error('[getOptimizedRoute] Bad request - check coordinate format and parameters');
          } else if (response.status === 404) {
            console.error('[getOptimizedRoute] Route not found - coordinates may be in invalid location');
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`[getOptimizedRoute] Direct API response for ${routeType}:`, data);
        
        // Check if we have routes in the response
        if (!data.routes || data.routes.length === 0) {
          console.warn(`[getOptimizedRoute] No routes returned for ${routeType}`);
          return { type: routeType, response: null };
        }
        
        return { type: routeType, response: data };
      } catch (error) {
        console.error(`[getOptimizedRoute] Direct API failed for ${routeType}, trying TomTom SDK fallback:`, error);
        
        // Fallback to TomTom SDK if direct API fails
        try {
          console.log(`[getOptimizedRoute] Attempting SDK fallback for ${routeType}...`);
          const sdkResponse = await services.calculateRoute({
            key: apiKey,
            locations: [
              { lat: origin.lat, lng: origin.lng },
              { lat: destination.lat, lng: destination.lng },
            ],
            travelMode: travelMode,
            routeType,
            traffic: true,
            computeTravelTimeFor: 'all',
            instructionsType: 'text',
            avoid: avoid.length > 0 ? avoid : undefined
          });
          
          console.log(`[getOptimizedRoute] SDK fallback successful for ${routeType}:`, sdkResponse);
          
          // Format SDK response to match expected structure
          const formattedResponse = {
            routes: sdkResponse.routes || []
          };
          
          return { type: routeType, response: formattedResponse };
        } catch (sdkError) {
          console.error(`[getOptimizedRoute] SDK fallback also failed for ${routeType}:`, sdkError);
          return { type: routeType, response: null };
        }
      }
    });

    const routeResults = await Promise.all(routePromises);
    console.log('[getOptimizedRoute] Route results:', routeResults);
    
    const validResults = routeResults.filter(result => {
      const isValid = result.response && result.response.routes && result.response.routes.length > 0;
      console.log(`[getOptimizedRoute] Route ${result.type} valid:`, isValid, result.response);
      return isValid;
    });
    
    if (validResults.length === 0) {
      console.error('[getOptimizedRoute] No valid routes found from any route type');
      console.error('[getOptimizedRoute] All route results:', routeResults);
      
      // Check if it's an API key issue
      const errorDetails = routeResults.map(r => r.response).filter(r => r !== null);
      if (errorDetails.length > 0) {
        console.error('[getOptimizedRoute] API error details:', errorDetails);
      }
      
      return null;
    }

    console.log('[getOptimizedRoute] Found', validResults.length, 'valid route types');
    
    // Use fastest as main route, others as alternatives
    const mainRouteData = validResults.find(r => r.type === 'fastest') || validResults[0];
    const alternativeRouteData = validResults.filter(r => r.type !== 'fastest');

    console.log('[getOptimizedRoute] Main route type:', mainRouteData.type);
    console.log('[getOptimizedRoute] Alternative route types:', alternativeRouteData.map(r => r.type));

    if (!mainRouteData) {
      console.error('[getOptimizedRoute] No main route data available');
      return null;
    }

    // Process all routes
    const mainTomtomRoute = mainRouteData.response.routes[0];
    const { routeLeg: mainRoute, incidents } = processRoute(mainTomtomRoute, origin, destination);

    // Process alternative routes
    const alternativeRoutes = alternativeRouteData.map(routeData => {
      const processedRoute = processRoute(routeData.response.routes[0], origin, destination);
      return {
        ...processedRoute.routeLeg,
        type: routeData.type as any // Add the route type
      };
    });

    console.log("[getOptimizedRoute] Processed main route:", mainRoute);
    console.log("[getOptimizedRoute] Parsed incidents:", incidents);

    // Generate AI summary based on route data
    const aiSummaryPrompt = `
      You are a smart route planning assistant. Analyze the following route data and provide a brief, helpful summary for the driver.
      
      Main Route:
      - Distance: ${(mainRoute.distanceInMeters / 1000).toFixed(1)} km
      - Travel Time: ${Math.round(mainRoute.travelTimeInSeconds / 60)} minutes
      - Traffic Delay: ${Math.round(mainRoute.trafficDelayInSeconds / 60)} minutes
      
      Alternative Routes Available: ${alternativeRoutes.length}
      Active Incidents: ${incidents.length}
      
      Vehicle Type: ${vehicle}
      Avoid Tolls: ${options.avoidTolls ? 'Yes' : 'No'}
      Avoid Highways: ${options.avoidHighways ? 'Yes' : 'No'}
      
      Provide a concise, actionable summary (2-3 sentences) that highlights the key information a driver needs to know.
    `;
    
    let aiSummary = 'Route calculated successfully.';
    try {
      aiSummary = await getAIChatCompletion('openai/gpt-3.5-turbo', aiSummaryPrompt, false);
    } catch (error) {
      console.warn('[getOptimizedRoute] Failed to generate AI summary, using fallback');
    }

    const summary = `Fastest route: ${(mainRoute.distanceInMeters / 1000).toFixed(1)} km, estimated travel time is ${Math.round(mainRoute.travelTimeInSeconds / 60)} minutes.`;

    const optimizedRoute: OptimizedRoute = {
      summary: summary,
      aiSummary: aiSummary,
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

    const aiResponse = await getAIChatCompletion('deepseek/deepseek-chat', prompt, true);

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

    const aiHeatmapResponse = await getAIChatCompletion('deepseek/deepseek-chat', heatmapPrompt, true);
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