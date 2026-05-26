# Models Search & Scraper API - Plan

## Overview
A Bun-based API server that searches and scrapes AI models from multiple providers and gateways.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Server (Bun)                      │
├─────────────────────────────────────────────────────────┤
│  Endpoints:                                              │
│  - GET /models?provider={name}   - Search by provider   │
│  - GET /models?gateway={name}    - Search by gateway    │
│  - GET /models?search={query}    - Global search        │
│  - GET /models                   - All models            │
└─────────────────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
┌──────────────────┐    ┌────────────────────────┐
│  Official APIs   │    │  Web Scraper (Fallback) │
│  - OpenRouter    │    │  - HTML parsing        │
│  - Ollama        │    │  - DOM extraction      │
│  - HuggingFace   │    │  - Retry logic         │
│  - Others...     │    │  - Error handling      │
└──────────────────┘    └────────────────────────┘
```

## Supported Providers & Gateways

### Gateways (Aggregators)
- **OpenRouter** - Main aggregator gateway
- **Kilo** - Alternative gateway
- **Other gateways** - Extensible

### Providers (Direct sources)
- **OpenAI** (via OpenRouter)
- **Anthropic** (via OpenRouter)
- **Google** (via OpenRouter)
- **Meta** (via OpenRouter)
- **Mistral** (via OpenRouter)
- **Llama** (via Ollama)
- **Hugging Face models**
- **Any provider with official API**

## Implementation Plan

### Phase 1: Project Setup
- [x] Initialize Bun project
- [ ] Add dependencies:
  - `bun-types` for TypeScript support
  - `axios` for HTTP requests
  - `cheerio` for HTML scraping
  - `dotenv` for environment config

### Phase 2: Configuration System
- [ ] Define provider/gateway configuration
- [ ] API credentials management
- [ ] Fallback strategies

### Phase 3: API Implementation
- [ ] Create `/models` endpoint
- [ ] Create `/models/search` endpoint
- [ ] Create `/models/provider/:name` endpoint
- [ ] Create `/models/gateway/:name` endpoint

### Phase 4: Scraping System
- [ ] Create provider scraper interface
- [ ] Implement HTML parser
- [ ] Add cache layer for scraped data

### Phase 5: Error Handling & Enhancement
- [ ] Request timeout handling
- [ ] Rate limiting
- [ ] Result deduplication
- [ ] Logging & monitoring

## Data Structure

### Model Schema
```typescript
interface Model {
  id: string;
  name: string;
  provider: string;
  gateway?: string;
  contextWindow: number;
  supportedFeatures: string[];
  pricing?: {
    prompt: number;
    completion: number;
  };
  url?: string;
}
```

## API Endpoints

### GET /models
Returns all available models from configured providers/gateways.

Query Parameters:
- `provider` (optional): Filter by provider name
- `gateway` (optional): Filter by gateway name
- `search` (optional): Full-text search query
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset

Response:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 50,
    "limit": 100,
    "offset": 0
  }
}
```

### GET /models/search?q={query}
Search models by name, description, or features.

### GET /models/provider/:provider
Get all models from a specific provider.

### GET /models/gateway/:gateway
Get all models from a specific gateway.

## Configuration Files

### config/providers.ts
Provider configurations with API endpoints and authentication.

### config/gateways.ts
Gateway configurations and authentication.

### scraper/providers/
Scraper implementations for each provider.

## Error Handling Strategy

1. **Try Official API First**: Use provider's official API if credentials exist
2. **Fallback to Scraper**: If API fails or no credentials, use web scraper
3. **Circuit Breaker**: Skip unresponsive providers after 3 failures
4. **Graceful Degradation**: Return available models even if some fail

## Extensibility

- Easy to add new providers by implementing scraper interface
- Gateway configurations are externalizable
- Plugin system for custom scrapers
