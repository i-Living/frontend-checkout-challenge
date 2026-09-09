import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const store = process.env.DATA_FILE ?? fileURLToPath(new URL('../.data/store.json', import.meta.url));
await rm(store, { force: true });
await rm(`${store}.tmp`, { force: true });
console.log(
  `Local data cleared: ${store}. Create a new session. Keep the API stopped while resetting.`,
);
