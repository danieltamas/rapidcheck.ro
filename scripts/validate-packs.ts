import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const packsDir = resolve(root, 'rule-packs');

let checked = 0;
for (const file of readdirSync(packsDir)) {
  if (!file.endsWith('.json')) continue;
  const path = resolve(packsDir, file);
  JSON.parse(readFileSync(path, 'utf8')) as unknown;
  checked++;
}

console.log(`Validated ${String(checked)} bundled JSON pack(s).`);
