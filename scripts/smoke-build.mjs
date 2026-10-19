import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const project = fileURLToPath(new URL('../', import.meta.url));
const child = spawn(process.execPath, ['scripts/serve.mjs', '--mount=academiai'], {
  cwd: project,
  env: { ...process.env, ACADEMIAI_PORT: '4188' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Server did not start')), 10000);
    child.once('error', reject);
    child.stderr.on('data', (d) => {
      output += d;
    });
    child.stdout.on('data', (d) => {
      output += d;
      if (output.includes('is running')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('exit', (code) => {
      if (code) reject(Error(output));
    });
  });
  const base = 'http://127.0.0.1:4188/academiai/';
  const html = await fetch(base);
  assert.equal(html.status, 200);
  const text = await html.text();
  assert.match(text, /AcademiAI/);
  assert.equal((await fetch('http://127.0.0.1:4188/')).status, 404);
  assert.equal((await fetch(`${base}not-a-file`)).status, 404);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  let count = 0;
  for (const file of await readdir(new URL('../dist/assets/', import.meta.url))) {
    const response = await fetch(new URL(`assets/${file}`, base), { method: 'HEAD' });
    assert.equal(response.status, 200, file);
    assert.ok(Number(response.headers.get('content-length')) > 0, file);
    count++;
    if (file.endsWith('.js')) assert.match(response.headers.get('content-type'), /javascript/);
    if (file.endsWith('.css')) assert.match(response.headers.get('content-type'), /css/);
    if (file.endsWith('.webp')) assert.match(response.headers.get('content-type'), /image\/webp/);
  }
  for (const file of [...text.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)].map((m) => m[1]))
    assert.equal((await fetch(new URL(file, base))).status, 200);
  console.log(
    `Production smoke checks passed: repository subpath, HTML entry, ${count} local assets, MIME types, missing files and method restrictions.`,
  );
} finally {
  child.kill();
}
