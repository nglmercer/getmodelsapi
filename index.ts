import { serve } from '@hono/node-server';
import app from './src/api';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 GetModels API server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`📍 Server ready at http://localhost:${info.port}`);
});