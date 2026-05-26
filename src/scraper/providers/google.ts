import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as Parser from 'cheerio';
import type { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeGoogle(config: ProviderConfig): Promise<ScraperResult> {
  try {
    if (config.apiKey) {
      const response = await axios.get(`${config.baseUrl}/models`, {
        params: { key: config.apiKey },
        timeout: 10000,
      });

      const models: Model[] = (response.data.models || []).map((m: any) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name,
        provider: 'google',
        contextWindow: m.inputTokenLimit || 32768,
        supportedFeatures: m.supportedGenerationMethods?.includes('generateContent')
          ? ['chat'] : ['completion'],
        freeTier: true,
        url: `https://ai.google.dev/gemini-api/docs/models#${m.name.replace('models/', '')}`,
        description: m.description,
      }));

      return { success: true, models };
    }

    const response = await axios.get('https://ai.google.dev/gemini-api/docs/models', {
      headers: {
        'User-Agent': 'GetModels API Scraper',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = Parser.load(response.data);
    const models: Model[] = [];

    $('h2[id], h3[id]').each((_, el) => {
      const id = $(el).attr('id') || '';
      if (!id.includes('gemini')) return;

      const name = $(el).text().trim();
      const section = $(el).nextUntil('h2, h3');
      const descText = section.filter('p').first().text().trim();

      if (models.some(m => m.id === id)) return;

      models.push({
        id,
        name: name || id,
        provider: 'google',
        contextWindow: 32768,
        supportedFeatures: ['chat'],
        freeTier: true,
        url: `https://ai.google.dev/gemini-api/docs/models#${id}`,
        description: descText.substring(0, 200) || undefined,
      });
    });

    return { success: true, models };
  } catch (error) {
    console.error('Failed to scrape Google:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
