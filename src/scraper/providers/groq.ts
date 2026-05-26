import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeGroq(config: ProviderConfig): Promise<ScraperResult> {
  try {
    const response = await axios.get(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey || ''}`,
        'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
        'X-Title': 'GetModels API',
      },
      timeout: 10000,
    });

    const models: Model[] = response.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      provider: model.provider || 'groq',
      contextWindow: model.context_window || 4096,
      supportedFeatures: ['chat', 'completion'],
      pricing: model.pricing,
      url: `https://console.groq.com/docs/models/${model.id}`,
      description: model.description,
    }));

    return { success: true, models };
  } catch (error) {
    console.error('Failed to scrape Groq:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
