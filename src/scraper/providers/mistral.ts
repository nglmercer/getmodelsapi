import axios from 'axios';
import axiosRetry from 'axios-retry';
import * as Parser from 'cheerio';
import type { Model, ProviderConfig, ScraperResult } from './index';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response?.status !== 429,
});

export async function scrapeMistral(config: ProviderConfig): Promise<ScraperResult> {
  try {
    if (config.apiKey) {
      const response = await axios.get(`${config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
        timeout: 10000,
      });

      const models: Model[] = (response.data.data || []).map((m: any) => ({
        id: m.id,
        name: m.id,
        provider: 'mistral',
        contextWindow: m.max_context_length || 32768,
        supportedFeatures: ['chat', 'completion'],
        freeTier: true,
        url: `https://docs.mistral.ai/getting-started/models/#${m.id}`,
        description: m.owned_by ? `Owned by ${m.owned_by}` : undefined,
      }));

      return { success: true, models };
    }

    const response = await axios.get('https://docs.mistral.ai/getting-started/models/', {
      headers: {
        'User-Agent': 'GetModels API Scraper',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    const $ = Parser.load(response.data);
    const models: Model[] = [];

    const nonModelHeadings = /why mistral|explore|documentation|build|legal|community|getting started|overview|quickstart|api reference|sdks/i;

    $('h2, h3, h4').each((_, el) => {
      const text = $(el).text().trim();
      if (!text || text.length < 3 || nonModelHeadings.test(text)) return;

      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const section = $(el).nextUntil('h2, h3, h4');
      const descText = section.filter('p').first().text().trim();

      models.push({
        id,
        name: text,
        provider: 'mistral',
        contextWindow: 32768,
        supportedFeatures: ['chat'],
        freeTier: true,
        url: `https://docs.mistral.ai/getting-started/models/#${id}`,
        description: descText.substring(0, 200) || undefined,
      });
    });

    return { success: true, models };
  } catch (error) {
    console.error('Failed to scrape Mistral:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
