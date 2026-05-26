import { ProviderConfig, ScraperResult } from '../providers/index';
import { scrapeOpenRouter } from './openrouter';
import { scrapeOllama } from './ollama';
import { scrapeHuggingFace, scrapeHuggingFaceHTML } from './huggingface';
import { scrapeKilo } from './kilo';
import { scrapeGroq } from './groq';

export interface ScraperFactory {
  createScraper(providerName: string, config: ProviderConfig): (options?: any) => Promise<ScraperResult>;
}

export const scraperFactory: ScraperFactory = {
  createScraper: (providerName: string, config: ProviderConfig) => {
    switch (providerName) {
      case 'openrouter':
        return () => scrapeOpenRouter(config);
      case 'ollama':
        return () => scrapeOllama(config);
      case 'huggingface':
        return (options: any = {}) => {
          if (options.useHTML) {
            return scrapeHuggingFaceHTML(config);
          }
          return scrapeHuggingFace(config);
        };
      case 'kilo':
        return () => scrapeKilo(config);
      case 'groq':
        return () => scrapeGroq(config);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  },
};

export function getScraper(providerName: string, config: ProviderConfig) {
  try {
    return scraperFactory.createScraper(providerName, config);
  } catch (error) {
    console.error(`Failed to create scraper for ${providerName}:`, error);
    throw error;
  }
}
