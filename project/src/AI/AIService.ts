import OpenAI from 'openai';
import { AIConfig } from './config';

// Manages a pool of OpenAI client instances, one for each API key type.
const clients: { [key: string]: OpenAI } = {};

export type ApiKeyType = 'default' | 'routing';

/**
 * Initializes and returns a specific instance of the OpenAI client based on key type.
 * This function ensures each client is only created once.
 */
function getOpenAIClient(keyType: ApiKeyType = 'default'): OpenAI {
  if (clients[keyType]) {
    return clients[keyType];
  }

  const { apiKey, routingApiKey, baseURL, siteURL, siteTitle } = AIConfig;

  // Use the routing key if it's requested AND available. Otherwise, fall back to the default key.
  const keyToUse = keyType === 'routing' && routingApiKey ? routingApiKey : apiKey;

  if (!keyToUse) {
    // This error will now only trigger if the default key is also missing.
    throw new Error(`The required OpenAI API key is not configured. Please ensure VITE_OPENAI_API_KEY is set.`);
  }

  const newClient = new OpenAI({
    baseURL,
    apiKey: keyToUse,
    defaultHeaders: {
      'HTTP-Referer': siteURL,
      'X-Title': siteTitle,
    },
    dangerouslyAllowBrowser: true,
  });

  clients[keyType] = newClient;
  return newClient;
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
  jsonMode: boolean = false,
  keyType: ApiKeyType = 'default'
): Promise<string> {
  const client = getOpenAIClient(keyType);
  
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1, 
    response_format: jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Failed to get a valid response from the AI service.');
  }

  return content;
} 