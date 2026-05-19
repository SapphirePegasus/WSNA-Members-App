// scripts/inject-sw-timestamp.mjs
// Replaces the __BUILD_TIMESTAMP__ placeholder in public/sw.js with the
// current Unix timestamp at build time. Run via postbuild in package.json.
// This ensures each production deploy gets a unique cache version without
// requiring manual CACHE_VERSION bumps.

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = resolve(__dirname, "../public/sw.js");

const timestamp = Date.now().toString();
const content = readFileSync(swPath, "utf8");
const replaced = content.replace(/"__BUILD_TIMESTAMP__"/g, `"${timestamp}"`);

writeFileSync(swPath, replaced, "utf8");
console.log(`[inject-sw-timestamp] Injected BUILD_TIMESTAMP=${timestamp} into public/sw.js`);