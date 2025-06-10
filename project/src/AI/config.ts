/**
 * The configuration for the AI services using OpenRouter.
 * It is recommended to use environment variables for all sensitive data.
 */
export const aiConfig = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  siteUrl: import.meta.env.VITE_SITE_URL,
  siteName: import.meta.env.VITE_SITE_NAME,
};

// A check to provide a clear error message during development if the key is missing.
if (!aiConfig.apiKey) {
  console.error(
    'OpenRouter API key is not set. Please add VITE_OPENROUTER_API_KEY to your .env file.'
  );
} 