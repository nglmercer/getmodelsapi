import { PROVIDERS } from '../config/providers';
import { fetchByProvider } from '../api/providers';
import { scrapeAllProviders } from '../scraper';
import type { Model, ProviderConfig, SearchParams } from '../types';

const modelCache = new Map<string, { data: Model[]; timestamp: number }>();
const cacheTTL = 300000;

function getCacheKey(provider: string, params: Partial<SearchParams>): string {
  return `${provider}:${JSON.stringify(params)}`;
}

function getCached(key: string): Model[] | null {
  const cached = modelCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > cacheTTL) {
    modelCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(key: string, data: Model[]): void {
  modelCache.set(key, { data, timestamp: Date.now() });
}

function sortProvidersByFreeTier(providers: ProviderConfig[]): ProviderConfig[] {
  return [...providers].sort((a, b) => {
    const aScore = (a.freeTier && a.apiKey) ? 0 : a.freeTier ? 1 : 2;
    const bScore = (b.freeTier && b.apiKey) ? 0 : b.freeTier ? 1 : 2;
    if (aScore !== bScore) return aScore - bScore;
    return a.priority - b.priority;
  });
}

async function fetchModels(provider: string, params: Partial<SearchParams>): Promise<Model[]> {
  const key = getCacheKey(provider, params);
  const cached = getCached(key);
  if (cached) return cached;

  let models: Model[] = [];

  const providerConfig = PROVIDERS.find(p => p.name === provider);
  if (providerConfig && fetchByProvider[provider]) {
    try {
      models = await fetchByProvider[provider](providerConfig);
    } catch (error) {
      console.error(`API fetch failed for ${provider}, falling back to scraper`);
    }
  }

  if (models.length === 0 && providerConfig?.supportsScraping) {
    try {
      const scraperResults = await scrapeAllProviders([providerConfig]);
      scraperResults.forEach(result => {
        if (result.success && Array.isArray(result.models)) {
          models = models.concat(result.models);
        }
      });
    } catch (error) {
      console.error(`Scraper failed for ${provider}:`, error);
    }
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    models = models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  }

  if (params.limit) models = models.slice(0, params.limit);
  if (params.offset) models = models.slice(params.offset);

  setCache(key, models);
  return models;
}

export async function getModels(options: {
  provider?: string;
  gateway?: string;
  search?: string;
  free?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<Model[]> {
  const { provider, gateway, search, free, limit = 100, offset = 0 } = options;

  if (provider) {
    return fetchModels(provider, { search, limit, offset });
  }

  if (gateway) {
    const gatewayProvider = PROVIDERS.find(p => p.name === gateway && p.type === 'gateway');
    if (!gatewayProvider) return [];
    return fetchModels(gatewayProvider.name, { search, limit, offset });
  }

  const allModels = new Map<string, Model>();
  const sortedProviders = sortProvidersByFreeTier(PROVIDERS);

  for (const p of sortedProviders) {
    try {
      const providerModels = await fetchModels(p.name, { search, limit, offset });
      providerModels.forEach(m => allModels.set(m.id, m));
    } catch (error) {
      console.error(`Failed to fetch from ${p.name}:`, error);
    }
  }

  let models = Array.from(allModels.values());

  if (search) {
    const q = search.toLowerCase();
    models = models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  }

  if (free) {
    models = models.filter(m => m.freeTier === true);
  }

  if (limit) models = models.slice(0, limit);
  if (offset) models = models.slice(offset);

  return models;
}

export async function getProviders(): Promise<Omit<ProviderConfig, 'apiKey'>[]> {
  return PROVIDERS.map(p => ({
    name: p.name,
    type: p.type,
    baseUrl: p.baseUrl,
    supportsScraping: p.supportsScraping,
    priority: p.priority,
    freeTier: p.freeTier,
  }));
}

export { PROVIDERS } from '../config/providers';
export type { Model, ProviderConfig, SearchParams, ApiResponse } from '../types';
