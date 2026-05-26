import type { ProviderConfig, ScraperResult } from './index';
import { scrapeOllama } from './ollama';
import { scrapeHuggingFace } from './huggingface';
import { scrapeGoogle } from './google';
import { scrapeMistral } from './mistral';
import { scrapeOpenRouter } from './openrouter';
import { scrapeKilo } from './kilo';

type ScraperFn = (options?: any) => Promise<ScraperResult>;

const scraperMap: Record<string, ScraperFn> = {
  ollama: (config) => scrapeOllama(config as ProviderConfig),
  huggingface: (config) => scrapeHuggingFace(config as ProviderConfig),
  google: (config) => scrapeGoogle(config as ProviderConfig),
  mistral: (config) => scrapeMistral(config as ProviderConfig),
  openrouter: (config) => scrapeOpenRouter(config as ProviderConfig),
  kilo: (config) => scrapeKilo(config as ProviderConfig),
};

export function getScraper(providerName: string, config: ProviderConfig): () => Promise<ScraperResult> {
  const fn = scraperMap[providerName];
  if (!fn) {
    throw new Error(`Unknown or unsupported provider: ${providerName}`);
  }
  return () => fn(config);
}
