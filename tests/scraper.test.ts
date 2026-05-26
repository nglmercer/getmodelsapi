import { describe, test, expect } from 'bun:test';
import { PROVIDERS } from '../src/config/providers';
import { getScraper } from '../src/scraper/providers/factory';
import { ProviderConfig, ScraperResult } from '../src/scraper/providers/index';

describe('Scraper - Get Provider', () => {
  test('should get provider configuration', () => {
    const provider = PROVIDERS.find(p => p.name === 'huggingface');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('huggingface');
    expect(provider?.supportsScraping).toBe(true);
  });

  test('should get ollama provider', () => {
    const provider = PROVIDERS.find(p => p.name === 'ollama');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('ollama');
    expect(provider?.supportsScraping).toBe(false);
  });

  test('should get openrouter provider', () => {
    const provider = PROVIDERS.find(p => p.name === 'openrouter');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('openrouter');
    expect(provider?.supportsScraping).toBe(true);
  });
});

describe('Scraper - Search', () => {
  test('should create scraper for huggingface', () => {
    const config: ProviderConfig = {
      name: 'huggingface',
      type: 'provider',
      baseUrl: 'https://huggingface.co',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('huggingface', config);
    expect(scraperFn).toBeDefined();
    expect(typeof scraperFn).toBe('function');
  });

  test('should create scraper for ollama', () => {
    const config: ProviderConfig = {
      name: 'ollama',
      type: 'provider',
      baseUrl: 'http://localhost:11434',
      apiKey: undefined,
      supportsScraping: false,
      priority: 3,
    };

    const scraperFn = getScraper('ollama', config);
    expect(scraperFn).toBeDefined();
    expect(typeof scraperFn).toBe('function');
  });

  test('should create scraper for openrouter', () => {
    const config: ProviderConfig = {
      name: 'openrouter',
      type: 'gateway',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('openrouter', config);
    expect(scraperFn).toBeDefined();
    expect(typeof scraperFn).toBe('function');
  });
});

describe('Scraper - Query', () => {
  test('should execute huggingface scraper and return result', async () => {
    const config: ProviderConfig = {
      name: 'huggingface',
      type: 'provider',
      baseUrl: 'https://huggingface.co',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('huggingface', config);
    const result: ScraperResult = await scraperFn();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.models)).toBe(true);
  });

  test('should execute ollama scraper and return result', async () => {
    const config: ProviderConfig = {
      name: 'ollama',
      type: 'provider',
      baseUrl: 'http://localhost:11434',
      apiKey: undefined,
      supportsScraping: false,
      priority: 3,
    };

    const scraperFn = getScraper('ollama', config);
    const result: ScraperResult = await scraperFn();

    expect(result).toBeDefined();
  });

  test('should execute openrouter scraper and return result', async () => {
    const config: ProviderConfig = {
      name: 'openrouter',
      type: 'gateway',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('openrouter', config);
    const result: ScraperResult = await scraperFn();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe('Scraper - Query with options', () => {
  test('should execute huggingface scraper with HTML option', async () => {
    const config: ProviderConfig = {
      name: 'huggingface',
      type: 'provider',
      baseUrl: 'https://huggingface.co',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('huggingface', config);
    const result: ScraperResult = await scraperFn({ useHTML: true });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('should execute huggingface scraper with default options', async () => {
    const config: ProviderConfig = {
      name: 'huggingface',
      type: 'provider',
      baseUrl: 'https://huggingface.co',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    const scraperFn = getScraper('huggingface', config);
    const result: ScraperResult = await scraperFn();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

describe('Scraper - Provider Validation', () => {
  test('should validate provider configuration', () => {
    const config: ProviderConfig = {
      name: 'test-provider',
      type: 'provider',
      baseUrl: 'https://example.com',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 1,
    };

    expect(config.name).toBe('test-provider');
    expect(config.type).toBe('provider');
    expect(config.baseUrl).toBe('https://example.com');
    expect(config.supportsScraping).toBe(true);
    expect(config.priority).toBe(1);
  });

  test('should validate gateway configuration', () => {
    const config: ProviderConfig = {
      name: 'test-gateway',
      type: 'gateway',
      baseUrl: 'https://gateway.example.com',
      apiKey: 'test-key',
      supportsScraping: true,
      priority: 2,
    };

    expect(config.name).toBe('test-gateway');
    expect(config.type).toBe('gateway');
    expect(config.supportsScraping).toBe(true);
  });
});

describe('Scraper - Provider Selection', () => {
  test('should select provider by name', () => {
    const providers = PROVIDERS;
    const selected = providers.find(p => p.name === 'huggingface');
    
    expect(selected).toBeDefined();
    expect(selected?.name).toBe('huggingface');
    expect(selected?.priority).toBe(5);
  });

  test('should select provider by priority', () => {
    const providers = PROVIDERS;
    const highestPriority = providers.sort((a, b) => a.priority - b.priority)[0];
    
    expect(highestPriority).toBeDefined();
    expect(highestPriority.name).toBe('openrouter');
    expect(highestPriority.priority).toBe(1);
  });

  test('should filter by supportsScraping', () => {
    const providers = PROVIDERS.filter(p => p.supportsScraping);
    
    expect(providers.length).toBeGreaterThan(0);
    expect(providers.every(p => p.supportsScraping)).toBe(true);
  });
});
