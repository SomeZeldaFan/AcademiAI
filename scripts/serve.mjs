import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(project, 'dist');
const mountArg = process.argv.find((a) => a.startsWith('--mount='))?.slice(8) ?? '';
const mount = mountArg ? `/${mountArg.replace(/^\/+|\/+$/g, '')}` : '';
let port = Number(process.env.ACADEMIAI_PORT || 4173);
const initialPort = port;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
};
try {
  await stat(resolve(root, 'index.html'));
} catch {
  console.error('The website build is missing. Run pnpm install, then pnpm build.');
  process.exit(1);
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }
  if (mount && pathname === mount) {
    response.writeHead(302, { Location: `${mount}/` });
    response.end();
    return;
  }
  if (mount && !pathname.startsWith(`${mount}/`)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const localPath = pathname.slice(mount.length);
  const filename = resolve(root, `.${localPath === '/' ? '/index.html' : localPath}`);
  const rel = relative(root, filename);
  if (rel === '..' || rel.startsWith(`..${sep}`) || rel.includes(':') || filename.includes('\0')) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filename);
    response.writeHead(200, {
      'Content-Type': mime[extname(filename)] ?? 'application/octet-stream',
      'Content-Length': data.length,
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && port < initialPort + 10) {
    port++;
    server.listen(port, '127.0.0.1');
  } else {
    console.error(error.message);
    process.exitCode = 1;
  }
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}${mount}/`;
  console.log(
    `AcademiAI is running at ${url}\nKeep this window open while presenting. Press Ctrl+C to stop.`,
  );
  if (process.argv.includes('--open') && !process.argv.includes('--no-open')) {
    if (process.platform === 'win32')
      spawn('cmd.exe', ['/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' });
    else console.log(`Open ${url} in your browser.`);
  }
});
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
