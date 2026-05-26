import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PROVIDERS } from '../config/providers';
import { fetchModelsByProvider } from '../api/providers';
import { scrapeAllProviders } from '../scraper';
import { Model, SearchParams, ApiResponse } from '../types';

const app = new Hono();

// Middleware
app.use('*', cors({
  allowOrigin: (_, c) => {
    const origin = c.req.header('Origin');
    return origin ? origin : '*';
  },
}));

// In-memory cache
const modelCache = new Map<string, { data: Model[]; timestamp: number }>();
const cacheTTL = 300000; // 5 minutes

// Helper: Get cache key
function getCacheKey(provider: string, params: Partial<SearchParams>): string {
  return `${provider}:${JSON.stringify(params)}`;
}

// Helper: Cache result
function cacheResult(key: string, data: Model[]): void {
  modelCache.set(key, { data, timestamp: Date.now() });
}

// Helper: Get cached result
function getCached(key: string): Model[] | null {
  const cached = modelCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > cacheTTL) {
    modelCache.delete(key);
    return null;
  }
  return cached.data;
}

// Helper: Fetch models from provider (API or scraper)
async function fetchModels(provider: string, params: Partial<SearchParams>): Promise<Model[]> {
  const key = getCacheKey(provider, params);
  const cached = getCached(key);
  
  if (cached) {
    return cached;
  }

  let models: Model[] = [];

  // Try API first
  const providerConfig = PROVIDERS.find(p => p.name === provider);
  if (providerConfig && fetchModelsByProvider[provider]) {
    try {
      models = await fetchModelsByProvider[provider](providerConfig);
    } catch (error) {
      console.error(`API fetch failed for ${provider}, falling back to scraper`);
    }
  }

  // Fallback to scraper if API failed or no credentials
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

  // Search filtering
  if (params.search) {
    models = models.filter(m => 
      m.name.toLowerCase().includes(params.search.toLowerCase()) ||
      m.description?.toLowerCase().includes(params.search.toLowerCase()) ||
      m.id.toLowerCase().includes(params.search.toLowerCase())
    );
  }

  // Limit and offset
  if (params.limit) {
    models = models.slice(0, params.limit);
  }
  if (params.offset) {
    models = models.slice(params.offset);
  }

  cacheResult(key, models);
  return models;
}

// GET /models
app.get('/models', async (c) => {
  const provider = c.req.query('provider');
  const gateway = c.req.query('gateway');
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  let models: Model[] = [];

  // If specific provider/gateway, fetch from that source
  if (provider) {
    models = await fetchModels(provider, { search, limit, offset });
  } else if (gateway) {
    const gatewayProvider = PROVIDERS.find(p => p.name === gateway && p.type === 'gateway');
    if (gatewayProvider) {
      models = await fetchModels(gatewayProvider.name, { search, limit, offset });
    }
  } else {
    // Fetch from all providers
    const allModels = new Map<string, Model[]>();
    
    for (const p of PROVIDERS) {
      if (p.apiKey) {
        try {
          const models = await fetchModels(p.name, { search, limit, offset });
          models.forEach(m => allModels.set(m.id, m));
        } catch (error) {
          console.error(`Failed to fetch from ${p.name}:`, error);
        }
      } else if (p.supportsScraping) {
        try {
          const models = await scrapeModels(p);
          models.forEach(m => allModels.set(m.id, m));
        } catch (error) {
          console.error(`Failed to scrape from ${p.name}:`, error);
        }
      }
    }

    models = Array.from(allModels.values());
    if (search) {
      models = models.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (limit) models = models.slice(0, limit);
    if (offset) models = models.slice(offset);
  }

  return c.json({
    success: true,
    data: models,
    meta: {
      total: models.length,
      limit,
      offset,
    }
  } as ApiResponse<{ models: Model[] }>);
});

// GET /models/search
app.get('/models/search', async (c) => {
  const q = c.req.query('q') || c.req.query('query') || '';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  if (!q) {
    return c.json({
      success: true,
      data: { models: [], error: 'Search query is required' },
    } as ApiResponse<{ models: Model[] }>);
  }

  const allModels = new Map<string, Model[]>();
  
  for (const p of PROVIDERS) {
    if (p.apiKey && p.type === 'gateway') {
      try {
        const models = await fetchModels(p.name, { search: q, limit, offset });
        models.forEach(m => allModels.set(m.id, m));
      } catch (error) {
        console.error(`Search failed for ${p.name}:`, error);
      }
    } else if (p.supportsScraping) {
      try {
        const models = await scrapeModels(p);
        models.forEach(m => allModels.set(m.id, m));
      } catch (error) {
        console.error(`Search scraper failed for ${p.name}:`, error);
      }
    }
  }

  const models = Array.from(allModels.values()).filter(m => 
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    m.description?.toLowerCase().includes(q.toLowerCase()) ||
    m.id.toLowerCase().includes(q.toLowerCase())
  ).slice(0, limit);

  return c.json({
    success: true,
    data: { models },
    meta: {
      total: models.length,
      limit,
      offset,
    }
  } as ApiResponse<{ models: Model[] }>);
});

// GET /models/provider/:provider
app.get('/models/provider/:provider', async (c) => {
  const provider = c.req.param('provider');
  const models = await fetchModels(provider, {});

  return c.json({
    success: true,
    data: { models },
    meta: {
      total: models.length,
    }
  } as ApiResponse<{ models: Model[] }>);
});

// GET /models/gateway/:gateway
app.get('/models/gateway/:gateway', async (c) => {
  const gateway = c.req.param('gateway');
  const gatewayProvider = PROVIDERS.find(p => p.name === gateway && p.type === 'gateway');

  if (!gatewayProvider) {
    return c.json({
      success: false,
      data: { models: [], error: `Gateway ${gateway} not found` },
    } as ApiResponse<{ models: Model[] }>);
  }

  const models = await fetchModels(gatewayProvider.name, {});

  return c.json({
    success: true,
    data: { models },
    meta: {
      total: models.length,
    }
  } as ApiResponse<{ models: Model[] }>);
});

// GET /providers
app.get('/providers', (c) => {
  const providers = PROVIDERS.map(p => ({
    name: p.name,
    type: p.type,
    baseUrl: p.baseUrl,
    supportsScraping: p.supportsScraping,
  }));

  return c.json({
    success: true,
    data: providers,
  });
});

// GET /health
app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default app;
