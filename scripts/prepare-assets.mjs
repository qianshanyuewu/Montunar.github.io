import { mkdir, cp, copyFile } from 'node:fs/promises';
await mkdir('public', { recursive: true });
for (const directory of ['audio', 'images', 'assets']) {
  await cp(directory, `public/${directory}`, { recursive: true });
}
await copyFile('favicon.ico', 'public/favicon.ico');
