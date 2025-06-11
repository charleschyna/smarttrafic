/**
 * Defines the configuration structure for the AI service.
 */
interface AIConfigType {
  apiKey: string | undefined;
  baseURL: string;
  siteURL: string;
  siteTitle: string;
}

/**
 * AI Service Configuration
 * 
 * Manages the settings for connecting to the OpenRouter AI service.
 * It's crucial that VITE_OPENAI_API_KEY is set in your .env file.
 */
export const AIConfig: AIConfigType = {
  // Your OpenRouter API key. This is a secret and should not be committed to git.
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  
  // The base URL for the OpenRouter API.
  baseURL: 'https://openrouter.ai/api/v1',
  
  // The URL of your site, used for HTTP referer header.
  siteURL: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',

  // The title of your site, used for X-Title header.
  siteTitle: 'SmartTraffic AI',
};

// In development mode, check if the API key is set and warn the developer if not.
if (import.meta.env.DEV && !AIConfig.apiKey) {
  console.warn(
    'OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file for AI features to work.'
  );
} 