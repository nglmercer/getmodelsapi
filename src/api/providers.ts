import axios from 'axios';
import type { Model, ProviderConfig } from '../types';

import { fetchModelsFromKilo } from './kilo';
import { fetchModelsFromGroq } from './groq';
import { fetchModelsFromGoogle } from './google';
import { fetchModelsFromMistral } from './mistral';
import { fetchModelsFromTogether } from './together';
import { fetchModelsFromCohere } from './cohere';

export async function fetchModelsFromOpenRouter(provider: ProviderConfig): Promise<Model[]> {
  if (!provider.apiKey) {
    return [];
  }

  try {
    const response = await axios.get(
      `${provider.baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
          'X-Title': 'GetModels API',
        },
        timeout: 10000,
      }
    );

    const models: Model[] = response.data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      provider: model.provider || provider.name,
      contextWindow: model.context_window || model.context_length,
      supportedFeatures: ['chat', 'completion'],
      pricing: model.pricing,
      url: `https://openrouter.ai/models/${model.id}`,
      description: model.description,
    }));

    return models;
  } catch (error) {
    console.error(`Failed to fetch models from OpenRouter:`, error);
    return [];
  }
}

export async function fetchModelsFromOllama(provider: ProviderConfig): Promise<Model[]> {
  try {
    const response = await axios.get(`${provider.baseUrl}/api/tags`, {
      timeout: 10000,
    });

    const models: Model[] = response.data.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      provider: provider.name,
      contextWindow: 4096,
      supportedFeatures: ['chat', 'completion'],
      url: `http://localhost:11434/api/show/${model.name}`,
    }));

    return models;
  } catch (error) {
    console.error(`Failed to fetch models from Ollama:`, error);
    return [];
  }
}

export async function fetchModelsFromHuggingFace(provider: ProviderConfig): Promise<Model[]> {
  try {
    const response = await axios.get(
      'https://huggingface.co/api/models?full=true&limit=100',
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey || ''}`,
        },
        timeout: 10000,
      }
    );

    const models: Model[] = response.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: provider.name,
      contextWindow: model.config?.max_position_embeddings || 4096,
      supportedFeatures: model.config?.supports_prompt_completion_protocol ? ['chat', 'completion'] : ['completion'],
      url: `https://huggingface.co/${model.id}`,
      description: model.cardData?.description,
    }));

    return models;
  } catch (error) {
    console.error(`Failed to fetch models from HuggingFace:`, error);
    return [];
  }
}

export const fetchByProvider: Record<string, (config: ProviderConfig) => Promise<Model[]>> = {
  openrouter: fetchModelsFromOpenRouter,
  kilo: fetchModelsFromKilo,
  groq: fetchModelsFromGroq,
  ollama: fetchModelsFromOllama,
  huggingface: fetchModelsFromHuggingFace,
  google: fetchModelsFromGoogle,
  mistral: fetchModelsFromMistral,
  together: fetchModelsFromTogether,
  cohere: fetchModelsFromCohere,
};
