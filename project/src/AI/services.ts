import { getAIChatCompletion } from './AIService';
import type { TrafficInsight, TrafficPrediction, AIResponse } from './types';

// Function to get real traffic data from TomTom API
async function getRealTrafficData(location: { lat: number; lng: number }, radius: number) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not defined in environment variables.');
  }

  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=${apiKey}&point=${location.lat},${location.lng}&radius=${radius}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch traffic data: ${response.statusText}`);
  }

  return await response.json();
}

// Generate traffic insights for a given location and radius
export async function generateTrafficInsights(
  location: { lat: number; lng: number },
  radius: number
): Promise<AIResponse<TrafficInsight[]>> {
  try {
    const trafficData = await getRealTrafficData(location, radius);
    
    const prompt = `You are a world-class traffic analysis AI. Based on the real-time traffic data below, provide critical and actionable insights.
      
      Traffic Data:
      ${JSON.stringify(trafficData, null, 2)}
      
      Your response MUST be a valid JSON object containing a single key "insights", which is an array of objects.
      Each object in the "insights" array must follow this exact format:
      {
        "severity": "critical" | "warning" | "info",
        "message": "A concise, human-readable description of the situation.",
        "type": "congestion" | "incident" | "construction" | "weather" | "other",
        "details": "A more detailed explanation of the causes and potential impacts.",
        "location": {
          "lat": <latitude>,
          "lng": <longitude>,
          "address": "A recognizable street name or area, if available."
        }
      }
      Focus on the most significant events. If there are no significant events, return an empty array for the "insights" key. Do not invent data.`;

    const aiResponse = await getAIChatCompletion('openai/gpt-4o', prompt, true);

    if (!aiResponse) {
      throw new Error('Received an empty response from the AI service.');
    }

    const parsedResponse = JSON.parse(aiResponse);
    
    if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
      throw new Error('AI response is not in the expected format.');
    }

    return {
      success: true,
      data: parsedResponse.insights,
    };
  } catch (error) {
    console.error('Error generating traffic insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred.',
    };
  }
}

// Predict traffic conditions for a specific location
export async function predictTraffic(
  location: { lat: number; lng: number }
): Promise<AIResponse<TrafficPrediction>> {
  try {
    const trafficData = await getRealTrafficData(location, 1);
    
    const prompt = `You are a sophisticated traffic prediction AI. Analyze the real-time traffic data provided and predict the conditions for the next hour.
      
      Traffic Data:
      ${JSON.stringify(trafficData, null, 2)}
      
      Your response must be a single, valid JSON object in the following strict format:
      {
        "level": "low" | "medium" | "high",
        "confidence": <a number between 0.0 and 1.0>,
        "details": "A brief explanation for your prediction, citing specific data points if possible.",
        "location": {
          "lat": ${location.lat},
          "lng": ${location.lng}
        }
      }
      Your analysis must be based solely on the provided data.`;

    const aiResponse = await getAIChatCompletion('openai/gpt-4o', prompt, true);

    if (!aiResponse) {
      throw new Error('Received an empty response from the AI service.');
    }

    const parsedResponse = JSON.parse(aiResponse);
    
    if (!parsedResponse.level || parsedResponse.confidence === undefined) {
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