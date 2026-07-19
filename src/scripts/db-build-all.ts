import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_PATH = path.resolve(__dirname, '../../package.json');

function dbBuildScripts(): string[] {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8')) as { scripts: Record<string, string> };
  return Object.keys(pkg.scripts).filter((name) => name.startsWith('db:build:') && name !== 'db:build:all');
}

const scripts = dbBuildScripts();
console.log(`Running ${scripts.length} db:build:* script(s): ${scripts.join(', ')}`);

for (const script of scripts) {
  // `script` only ever comes from this repo's own package.json script names, never
  // external input, so shelling out via execSync here is safe.
  execSync(`npm run ${script}`, { stdio: 'inherit' });
}
