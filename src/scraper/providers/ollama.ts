import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeOllama(config: ProviderConfig): Promise<ScraperResult> {
  try {
    const response = await axios.get(`${config.baseUrl}/api/tags`, {
      timeout: 10000,
    });

    if (typeof response.data !== 'object' || !Array.isArray(response.data.models)) {
      throw new Error('Invalid Ollama API response');
    }

    const models: Model[] = response.data.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      provider: 'ollama',
      contextWindow: 4096,
      supportedFeatures: ['chat', 'completion'],
      url: `http://localhost:11434/api/show/${model.name}`,
    }));

    return { success: true, models };
  } catch (error) {
    console.error('Failed to scrape Ollama:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
