# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture
- Avoid hardcoded model lists — fetch models via API or scrape them instead. Confidence: 0.85
- API keys are optional for all providers; scraping is the primary data source. Confidence: 0.85
- Omit providers that don't expose their models publicly (cannot be scraped). Confidence: 0.70

# typescript
- Avoid using `any` type — use proper types or `unknown` instead. Confidence: 0.85

# scraping
- Never use hardcoded/known model fallback data in scrapers — iterate on the scraping logic until it extracts accurate data from the live page. Confidence: 0.85
- When the listing page lacks context window data, enrich from individual model detail pages or alternative public sources. Confidence: 0.85

# caching
- Implement caching for scraped model data to avoid redundant HTTP requests across providers. Confidence: 0.70

