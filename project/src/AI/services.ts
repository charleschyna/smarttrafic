import { getAIChatCompletion } from './AIService';
import type { TrafficPrediction, AIResponse } from './types';

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

// Function to get traffic incident data from TomTom API
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
export async function getDashboardData(location: { lat: number; lng: number }, radius: number) {
  try {
    const [flowData, incidentData] = await Promise.all([
      getTrafficFlowData(location, radius),
      getTrafficIncidentData(location, radius)
    ]);

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