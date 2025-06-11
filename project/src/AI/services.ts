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
  location: { lat: number; lng: number; address?: string },
  radius: number // This is unused now, but we'll keep it for API consistency
): Promise<AIResponse<any>> {
  try {
    const locationHint = location.address 
      ? `The user's location is near: ${location.address}.` 
      : `The user is at an unspecified location.`;

    const prompt = `You are a world-class traffic analysis AI. Based on the user's location, provide a detailed, three-paragraph summary of the current and predicted traffic conditions.

The user is at precise coordinates Latitude: ${location.lat}, Longitude: ${location.lng}.
${locationHint}

Your response should be a well-written narrative.
- **Paragraph 1:** Start with a general overview of the traffic in the area ("Traffic in downtown Springfield is currently moderate..."). Mention the current average commute time and how it compares to the norm.
- **Paragraph 2:** Detail any specific incidents, congestion hotspots, or construction zones. Mention specific street names if possible (e.g., "There is heavy congestion near the North Bridge due to a minor accident on Oak Ave..."). Be specific about the impact.
- **Paragraph 3:** Provide a short-term forecast. What can drivers expect in the next hour or two? Mention if conditions are expected to improve, worsen, or stay the same, and why (e.g., "Looking ahead, congestion is expected to ease over the next hour as rush hour subsides...").

Your entire response should be plain text, formatted into three distinct paragraphs.`;

    // We no longer require a JSON object, so jsonMode is false.
    const aiResponse = await getAIChatCompletion('openai/gpt-4o', prompt, false);

    if (!aiResponse) {
      throw new Error('Received an empty response from the AI service.');
    }
    
    // The data is now expected to be a string.
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