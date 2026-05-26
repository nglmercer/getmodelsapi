import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Model } from '../types';
import { cacheGet, cacheSet, ONE_HOUR } from './cache';

async function enrichGoogleModel(model: Model): Promise<Model> {
  if (model.provider !== 'google' || model.contextWindow > 40000) {
    return model; // already enriched or not google
  }

  const cacheKey = `enrich-google-${model.id}`;
  const cached = cacheGet<Pick<Model, 'contextWindow' | 'supportedFeatures'>>(cacheKey);
  if (cached) {
    return { ...model, ...cached };
  }

  try {
    const url = model.url || `https://ai.google.dev/gemini-api/docs/models#${model.id}`;
    // Resolve actual URL: try the model-specific page
    const pageUrl = url.replace('/models#', '/models/');
    const response = await axios.get(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 GetModels' },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract input token limit
    let contextWindow = model.contextWindow;
    $('td, th, p, span').each((_, el) => {
      const text = $(el).text().trim();
      if (text.match(/input token/i)) {
        const next = $(el).next().text().trim() || text;
        const match = next.match(/(\d[\d,]*)\s*(?:tokens?|tokens)/i);
        if (match?.[1]) {
          contextWindow = parseInt(match[1].replace(/,/g, ''), 10);
        }
      }
    });

    // Extract features from capabilities table
    const features = new Set(model.supportedFeatures);
    $('td, th').each((_, el) => {
      const text = $(el).text().toLowerCase().trim();
      if (text.includes('image') || text.includes('vision')) features.add('vision');
      if (text.includes('audio') || text.includes('speech')) features.add('audio');
      if (text.includes('video')) features.add('video');
      if (text.includes('code') || text.includes('coding')) features.add('code');
      if (text.includes('embedding')) features.add('embeddings');
      if (text.includes('reasoning')) features.add('reasoning');
    });

    const enriched = {
      contextWindow,
      supportedFeatures: [...features],
    };
    cacheSet(cacheKey, enriched, ONE_HOUR);

    return { ...model, ...enriched };
  } catch {
    return model;
  }
}

export async function enrichModel(model: Model): Promise<Model> {
  if (model.provider === 'google') {
    return enrichGoogleModel(model);
  }
  return model;
}

export async function enrichModels(models: Model[]): Promise<Model[]> {
  return Promise.all(models.map(enrichModel));
}
