import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as Parser from 'cheerio';
import { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeHuggingFace(config: ProviderConfig): Promise<ScraperResult> {
  try {
    const response = await axios.get(
      'https://huggingface.co/api/models?full=true&limit=100',
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey || ''}`,
        },
        timeout: 10000,
      }
    );

    const models: Model[] = response.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: 'huggingface',
      gateway: 'huggingface',
      contextWindow: model.config?.max_position_embeddings || 4096,
      supportedFeatures: model.config?.supports_prompt_completion_protocol ? ['chat', 'completion'] : ['completion'],
      url: `https://huggingface.co/${model.id}`,
      description: model.cardData?.description,
    }));

    return {
      success: true,
      models,
    };
  } catch (error) {
    console.error('Failed to scrape HuggingFace:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function scrapeHuggingFaceHTML(config: ProviderConfig): Promise<ScraperResult> {
  try {
    const response = await axios.get(config.baseUrl, {
      headers: {
        'User-Agent': 'GetModels API Scraper',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const models = parseHuggingFaceHTML(response.data);
    return {
      success: true,
      models,
    };
  } catch (error) {
    console.error('Failed to scrape HuggingFace HTML:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function parseHuggingFaceHTML(html: string): Model[] {
  const $ = Parser.load(html);
  const models: Model[] = [];

  const modelCards = $('h-card');
  modelCards.each((_, card) => {
    const id = $(card).find('a').attr('href')?.replace('/library/', '') || '';
    const name = $(card).find('a').text().trim() || id;
    
    models.push({
      id,
      name,
      provider: 'huggingface',
      gateway: 'huggingface',
      contextWindow: 4096,
      supportedFeatures: ['completion'],
      url: `https://huggingface.co/${id}`,
      description: $(card).find('p').text().substring(0, 200),
    });
  });

  return models;
}
