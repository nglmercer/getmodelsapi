import { ProviderConfig } from '../config/providers';
import { getScraper } from './providers/factory';
import { ScraperResult } from './providers/index';

export async function scrapeModels(provider: ProviderConfig): Promise<ScraperResult[]> {
  if (!provider.supportsScraping) {
    return [];
  }

  const scraper = getScraper(provider.name, provider);
  const results = await scraper();

  return [results];
}

export async function scrapeAllProviders(providers: ProviderConfig[]): Promise<ScraperResult[]> {
  const results = await Promise.all(
    providers
      .filter(p => p.supportsScraping)
      .map(async (provider) => {
        return scrapeModels(provider);
      })
  );

  return results.flat();
}
