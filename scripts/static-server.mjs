import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4321);
const base = '/Montunar.github.io/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
};
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/Montunar.github.io') {
    res.writeHead(301, { Location: base });
    res.end();
    return;
  }
  if (!path.startsWith(base)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  let file = resolve(root, path.slice(base.length));
  if ((file !== root && !file.startsWith(root + sep)) || file.includes(`${sep}.git`)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    const headers = {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Length': data.length,
      'Accept-Ranges': 'bytes',
    };
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
      const end =
        range[1] && range[2] ? Math.min(data.length - 1, Number(range[2])) : data.length - 1;
      if (start > end || start >= data.length) {
        res.writeHead(416, { 'Content-Range': `bytes */${data.length}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        ...headers,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${data.length}`,
      });
      res.end(req.method === 'HEAD' ? undefined : data.subarray(start, end + 1));
    } else {
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : data);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(root, '404.html')).catch(() => Buffer.from('Not found')));
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Serving ${root} at http://127.0.0.1:${port}${base}`),
);
