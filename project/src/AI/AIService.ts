import OpenAI from 'openai';
import { AIConfig } from './config';

let openai: OpenAI | null = null;

/**
 * Initializes and returns a singleton instance of the OpenAI client.
 * This function ensures the client is only created once.
 */
function getOpenAIClient(): OpenAI {
  if (openai) {
    return openai;
  }

  const { apiKey, baseURL, siteURL, siteTitle } = AIConfig;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  openai = new OpenAI({
    baseURL,
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': siteURL,
      'X-Title': siteTitle,
    },
    dangerouslyAllowBrowser: true,
  });

  return openai;
}

/**
 * Gets a chat completion from the configured AI model.
 * Throws an error if the API call fails.
 *
 * @param model The model to use for the completion.
 * @param prompt The prompt to send to the model.
 * @param jsonMode Whether to request a JSON object response.
 * @returns The content of the AI's response.
 */
export async function getAIChatCompletion(
  model: string,
  prompt: string,
  jsonMode: boolean = false
): Promise<string> {
  const client = getOpenAIClient();
  
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1, 
    response_format: jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: 2018,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Failed to get a valid response from the AI service.');
  }

  return content;
} 