import { ProviderConfig } from '../types';

export const PROVIDERS: ProviderConfig[] = [
  {
    name: 'openrouter',
    type: 'gateway',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    supportsScraping: true,
    priority: 1,
  },
  {
    name: 'kilo',
    type: 'gateway',
    baseUrl: 'https://kilo.ai',
    apiKey: process.env.KILO_API_KEY,
    supportsScraping: true,
    priority: 2,
  },
  {
    name: 'groq',
    type: 'gateway',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    supportsScraping: true,
    priority: 3,
  },
  {
    name: 'ollama',
    type: 'provider',
    baseUrl: 'http://localhost:11434',
    apiKey: undefined,
    supportsScraping: false,
    priority: 4,
  },
  {
    name: 'huggingface',
    type: 'provider',
    baseUrl: 'https://huggingface.co',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    supportsScraping: true,
    priority: 5,
  },
];

export const PROVIDER_SOURCES = [
  'openrouter',
  'kilo',
  'groq',
  'ollama',
  'huggingface',
  'together',
  'cohere',
  'anthropic',
  'google',
  'mistral',
  'perplexity',
];
