# GetModels API

A Bun-based API server that searches and scrapes AI models from multiple providers and gateways with automatic fallback to web scraping.

## Features

- 🔍 **Multi-provider search**: OpenRouter, Kilo, Ollama, HuggingFace, and more
- 🌐 **Gateway support**: Aggregates models from different gateways
- ⚡ **Dual-mode operation**: Official APIs + Web scraping fallback
- 🚀 **Fast**: Built with Bun and Hono
- 📦 **RESTful API**: Simple JSON endpoints

## Quick Start

### Installation

```bash
bun install
```

### Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Set API keys (optional):
```bash
OPENROUTER_API_KEY="sk-or-v1-..."
# Other providers...
```

### Run

```bash
bun run index.ts
```

Server will start on `http://localhost:3000`

## API Endpoints

### GET /models

Get all models or filter by provider/gateway.

**Query Parameters:**
- `provider` - Filter by provider name (openrouter, ollama, huggingface)
- `gateway` - Filter by gateway name
- `search` - Full-text search
- `limit` - Max results (default: 100)
- `offset` - Pagination offset

**Example:**
```bash
# Get all models
curl http://localhost:3000/models

# Filter by provider
curl "http://localhost:3000/models?provider=openrouter"

# Search models
curl "http://localhost:3000/models?search=llama"

# With pagination
curl "http://localhost:3000/models?limit=10&offset=0"
```

### GET /models/search

Search models across all providers.

**Query Parameters:**
- `q` or `query` - Search query (required)
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Example:**
```bash
curl "http://localhost:3000/models/search?q=codegeex"
```

### GET /models/provider/:provider

Get models from a specific provider.

**Example:**
```bash
curl "http://localhost:3000/models/provider/openrouter"
curl "http://localhost:3000/models/provider/ollama"
```

### GET /models/gateway/:gateway

Get models from a specific gateway.

**Example:**
```bash
curl "http://localhost:3000/models/gateway/openrouter"
```

### GET /providers

List all configured providers.

**Example:**
```bash
curl http://localhost:3000/providers
```

### GET /health

Health check endpoint.

**Example:**
```bash
curl http://localhost:3000/health
```

## Response Format

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "meta-llama/llama-3-8b-instruct",
        "name": "Llama 3 8B Instruct",
        "provider": "openrouter",
        "gateway": "openrouter",
        "contextWindow": 8192,
        "supportedFeatures": ["chat", "completion"],
        "pricing": {
          "prompt": 0.0000005,
          "completion": 0.0000015
        },
        "url": "https://openrouter.ai/models/meta-llama/llama-3-8b-instruct",
        "description": "..."
      }
    ]
  },
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

## How It Works

### Mode 1: Official API (Preferred)
If API keys are configured, the server uses official APIs:
- OpenRouter API for aggregated models
- Ollama API for local models
- HuggingFace API for HF models

### Mode 2: Web Scraping (Fallback)
If no API keys or API fails, automatically falls back to:
- HTML parsing with Cheerio
- DOM extraction for model cards
- Retry logic with axios-retry

### Priority Order
1. Try official API with credentials
2. If API fails or no credentials → Web scraper
3. Return best available results

## Supported Providers

### Gateways
- **OpenRouter** - Main aggregator
- **Kilo** - Alternative gateway

### Direct Providers
- **Ollama** - Local model server
- **HuggingFace** - Model repository
- **OpenAI**, **Anthropic**, **Google**, etc. (via OpenRouter)

## Error Handling

- Automatic retry on network failures
- Graceful degradation (scraper fallback)
- Timeout handling (10-15 seconds)
- Rate limit protection

## Development

```bash
# Start dev server
bun run index.ts

# With custom port
PORT=8080 bun run index.ts
```

## License

MIT
