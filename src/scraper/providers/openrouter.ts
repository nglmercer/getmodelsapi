import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as Parser from 'cheerio';
import type { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeOpenRouter(config: ProviderConfig): Promise<ScraperResult> {
  try {
    const response = await axios.get(config.baseUrl, {
      headers: {
        'User-Agent': 'GetModels API Scraper',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });

    const $ = Parser.load(response.data);
    const models: Model[] = [];

    $('.model-card').each((_, card) => {
      const id = $(card).find('.model-id').text().trim();
      const name = $(card).find('.model-name').text().trim();
      const contextWindow = parseInt($(card).find('.context-window').text().replace(/\D/g, '') || '4096', 10);
      const pricingText = $(card).find('.pricing').text();
      const pricing = parseOpenRouterPricing(pricingText);

      models.push({
        id,
        name,
        provider: 'openrouter',
        contextWindow,
        supportedFeatures: ['chat', 'completion'],
        pricing,
        url: `https://openrouter.ai/models/${id}`,
        description: $(card).find('.description').text().substring(0, 200),
      });
    });

    return { success: true, models };
  } catch (error) {
    console.error('Failed to scrape OpenRouter:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function parseOpenRouterPricing(pricingText: string): { prompt: number; completion: number } | undefined {
  const promptMatch = pricingText.match(/Prompt: \$?([\d\.]+)/);
  const completionMatch = pricingText.match(/Completion: \$?([\d\.]+)/);

  if (promptMatch?.[1] && completionMatch?.[1]) {
    return {
      prompt: parseFloat(promptMatch[1]),
      completion: parseFloat(completionMatch[1]),
    };
  }
  return undefined;
}
