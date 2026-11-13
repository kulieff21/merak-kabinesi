import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Unsafe build destination');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'src', 'assets', '404.html', '.nojekyll']) {
  await cp(resolve(root, name), resolve(output, name), { recursive: true });
}
const metadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(output, 'build-info.json'), JSON.stringify({ name: metadata.name, version: metadata.version, exhibits: 9, defaultLanguage: 'en', languages: ['en', 'tr'] }) + '\n');
console.log('Standalone static site prepared in dist/.');
