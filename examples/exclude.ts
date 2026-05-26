import "dotenv/config";
import { getModels } from "../src/api/index";

// Exclude providers you don't want (local, slow, etc.)
const models = await getModels({
  free: true,
  limit: 1000,
});

console.log(`Models (excluding huggingface): ${models.length}`);
console.log(models);
