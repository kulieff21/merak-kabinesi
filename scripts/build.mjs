import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
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
await writeFile(resolve(output, 'build-info.json'), JSON.stringify({ name: 'merak-kabinesi', version: '1.0.0', exhibits: 9 }) + '\n');
console.log('Standalone static site prepared in dist/.');
