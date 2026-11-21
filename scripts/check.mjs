import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? collect(path) : entry.isFile() && path.endsWith('.js') ? [path] : [];
  });
}
const files = [...collect('src'), ...collect('tests')];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Sintaxe validada: ${files.length} arquivos JavaScript.`);
