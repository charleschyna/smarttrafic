import { getAI } from './config';
import type { TrafficInsight, TrafficPrediction, AIResponse } from './types';

// Function to get real traffic data from TomTom API
const getRealTrafficData = async (location: { lat: number; lng: number }, radius: number) => {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not defined');
  }

  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json?key=${apiKey}&point=${location.lat},${location.lng}&radius=${radius}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch traffic data');
  }

  return await response.json();
};

// Generate traffic insights for a given location and radius
export const generateTrafficInsights = async (
  location: { lat: number; lng: number },
  radius: number
): Promise<AIResponse> => {
  try {
    const openai = getAI();
    
    // Get real traffic data
    const trafficData = await getRealTrafficData(location, radius);
    
    const prompt = `You are a traffic analysis AI. Analyze these real traffic conditions:
      ${JSON.stringify(trafficData)}
      
      Provide insights in the following JSON format:
      [
        {
          "severity": "critical" | "warning" | "info",
          "message": "brief description",
          "type": "congestion" | "incident" | "construction" | "weather" | "other",
          "details": "detailed explanation",
          "location": {
            "lat": number,
            "lng": number,
            "address": "optional street name or area"
          }
        }
      ]
      Focus on current traffic conditions, road work, accidents, and weather impacts.
      Base your analysis on the real traffic data provided.
      Ensure the response is a valid JSON array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a traffic analysis AI that provides insights based on real traffic data. Always ensure the response is valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('Empty response from AI');
    }

    const response = JSON.parse(text);
    const insights = response.insights || response;
    
    if (!Array.isArray(insights)) {
      throw new Error('Invalid response format: expected an array');
    }

    return {
      success: true,
      data: insights,
    };
  } catch (error) {
    console.error('Error generating traffic insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights',
    };
  }
};

// Predict traffic conditions for a specific location
export const predictTraffic = async (
  location: { lat: number; lng: number }
): Promise<AIResponse> => {
  try {
    const openai = getAI();
    
    // Get real traffic data for a small radius
    const trafficData = await getRealTrafficData(location, 1);
    
    const prompt = `You are a traffic prediction AI. Analyze these real traffic conditions:
      ${JSON.stringify(trafficData)}
      
      Provide a prediction in the following JSON format:
      {
        "level": "low" | "medium" | "high",
        "confidence": number between 0 and 1,
        "details": "brief explanation of the prediction",
        "location": {
          "lat": number,
          "lng": number
        }
      }
      Base your prediction on the real traffic data provided.
      Ensure the response is a valid JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a traffic prediction AI that provides predictions based on real traffic data. Always ensure the response is valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('Empty response from AI');
    }

    const prediction = JSON.parse(text);
    
    if (!prediction.level || !prediction.confidence || !prediction.location) {
      throw new Error('Invalid prediction format');
    }

    return {
      success: true,
      data: prediction,
    };
  } catch (error) {
    console.error('Error predicting traffic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to predict traffic',
    };
  }
}; 