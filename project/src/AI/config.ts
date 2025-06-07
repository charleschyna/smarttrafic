import OpenAI from 'openai';

// Initialize the AI configuration
export const getAI = () => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not defined in environment variables');
    }
    
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Enable client-side usage
    });
  } catch (error) {
    console.error('Error initializing AI:', error);
    throw new Error('Failed to initialize AI service');
  }
}; 