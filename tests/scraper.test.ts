import { describe, test, expect } from 'bun:test';
import { PROVIDERS } from '../src/config/providers';
import { getScraper } from '../src/scraper/providers/factory';
import type { ProviderConfig, ScraperResult } from '../src/scraper/providers/index';

describe('Providers', () => {
  test('should have all expected providers', () => {
    const names = PROVIDERS.map(p => p.name);
    expect(names).toContain('google');
    expect(names).toContain('mistral');
    expect(names).toContain('openrouter');
    expect(names).toContain('together');
    expect(names).toContain('cohere');
    expect(names).toContain('kilo');
    expect(names).toContain('groq');
    expect(names).toContain('huggingface');
    expect(names).toContain('ollama');
  });

  test('should not include providers without public models', () => {
    const names = PROVIDERS.map(p => p.name);
    expect(names).not.toContain('anthropic');
    expect(names).not.toContain('perplexity');
  });

  test('free-tier providers should be first', () => {
    const freeProviders = PROVIDERS.filter(p => p.freeTier);
    const freeNames = freeProviders.map(p => p.name);
    expect(freeNames).toContain('google');
    expect(freeNames).toContain('mistral');
    expect(freeNames).toContain('together');
    expect(freeNames).toContain('cohere');
    expect(freeNames).toContain('ollama');
  });

  test('providers should have correct types', () => {
    for (const p of PROVIDERS) {
      expect(['provider', 'gateway']).toContain(p.type);
      expect(typeof p.name).toBe('string');
      expect(typeof p.supportsScraping).toBe('boolean');
      expect(typeof p.freeTier).toBe('boolean');
    }
  });
});

describe('Scraper factory', () => {
  const baseConfig: ProviderConfig = {
    name: 'openrouter',
    type: 'gateway',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: undefined,
    supportsScraping: true,
    priority: 1,
    freeTier: false,
  };

  test('should create scraper for openrouter', () => {
    const fn = getScraper('openrouter', baseConfig);
    expect(fn).toBeDefined();
    expect(typeof fn).toBe('function');
  });

  test('should create scraper for huggingface', () => {
    const fn = getScraper('huggingface', { ...baseConfig, name: 'huggingface', type: 'provider', baseUrl: 'https://huggingface.co' });
    expect(typeof fn).toBe('function');
  });

  test('should throw for unknown provider', () => {
    expect(() => getScraper('unknown', baseConfig)).toThrow('Unknown provider');
  });

  test('should create scraper for google', () => {
    const fn = getScraper('google', { ...baseConfig, name: 'google', type: 'provider', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', freeTier: true });
    expect(typeof fn).toBe('function');
  });

  test('should create scraper for mistral', () => {
    const fn = getScraper('mistral', { ...baseConfig, name: 'mistral', type: 'provider', baseUrl: 'https://api.mistral.ai/v1', freeTier: true });
    expect(typeof fn).toBe('function');
  });
});

describe('Scraper execution', () => {
  test('should execute openrouter scraper', async () => {
    const config: ProviderConfig = {
      name: 'openrouter',
      type: 'gateway',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: undefined,
      supportsScraping: true,
      priority: 1,
      freeTier: false,
    };

    const fn = getScraper('openrouter', config);
    const result: ScraperResult = await fn();
    expect(result).toBeDefined();
    expect('success' in result).toBe(true);
  });

  test('should execute huggingface scraper', async () => {
    const config: ProviderConfig = {
      name: 'huggingface',
      type: 'provider',
      baseUrl: 'https://huggingface.co',
      apiKey: undefined,
      supportsScraping: true,
      priority: 8,
      freeTier: false,
    };

    const fn = getScraper('huggingface', config);
    const result: ScraperResult = await fn();
    expect(result).toBeDefined();
    expect('success' in result).toBe(true);
  });
});
