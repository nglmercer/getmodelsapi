import type { ProviderConfig, ScraperResult } from './index';
import { scrapeOpenRouter } from './openrouter';
import { scrapeOllama } from './ollama';
import { scrapeHuggingFace } from './huggingface';
import { scrapeKilo } from './kilo';
import { scrapeGroq } from './groq';
import { scrapeGoogle } from './google';
import { scrapeMistral } from './mistral';

type ScraperFn = (options?: any) => Promise<ScraperResult>;

const scraperMap: Record<string, ScraperFn> = {
  openrouter: (config) => scrapeOpenRouter(config as ProviderConfig),
  ollama: (config) => scrapeOllama(config as ProviderConfig),
  huggingface: (config) => scrapeHuggingFace(config as ProviderConfig),
  kilo: (config) => scrapeKilo(config as ProviderConfig),
  groq: (config) => scrapeGroq(config as ProviderConfig),
  google: (config) => scrapeGoogle(config as ProviderConfig),
  mistral: (config) => scrapeMistral(config as ProviderConfig),
};

export function getScraper(providerName: string, config: ProviderConfig): () => Promise<ScraperResult> {
  const fn = scraperMap[providerName];
  if (!fn) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return () => fn(config);
}
