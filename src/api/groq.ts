import axios from 'axios';
import type { Model, ProviderConfig } from '../types';

export async function fetchModelsFromGroq(provider: ProviderConfig): Promise<Model[]> {
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

    const models: Model[] = response.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      provider: model.provider || provider.name,
      gateway: provider.name,
      contextWindow: model.context_window || 4096,
      supportedFeatures: ['chat', 'completion'],
      pricing: model.pricing,
      url: `https://console.groq.com/docs/models/${model.id}`,
      description: model.description,
    }));

    return models;
  } catch (error) {
    console.error(`Failed to fetch models from Groq:`, error);
    return [];
  }
}
