import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const packages = [
  ...Object.keys(manifest.dependencies),
  'framer-motion',
  'motion-dom',
  'motion-utils',
  'scheduler',
];
const store = await readdir(resolve(root, 'node_modules/.pnpm'));
const notices = [
  'ACADEMIAI — THIRD-PARTY NOTICES\n\nThe following licences apply to runtime libraries and fonts included in the build. Generated medal artwork and project-specific code are separate.\n',
];
for (const name of packages) {
  const directory = store.find((entry) => entry.startsWith(`${name.replace('/', '+')}@`));
  if (!directory) throw Error(`Package not found: ${name}`);
  const path = resolve(root, 'node_modules/.pnpm', directory, 'node_modules', name);
  const pkg = JSON.parse(await readFile(resolve(path, 'package.json'), 'utf8'));
  const files = (await readdir(path)).filter((file) =>
    /^(licen[cs]e|copying|notice)(\.|$)/i.test(file),
  );
  if (!files.length) throw Error(`Licence not found: ${name}`);
  notices.push(`\n${'='.repeat(72)}\n${name} ${pkg.version}\nLicence: ${pkg.license}\n`);
  for (const file of files)
    notices.push(`\n${file}\n\n${await readFile(resolve(path, file), 'utf8')}`);
}
await writeFile(resolve(root, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n'), 'utf8');
console.log(`Collected licence notices for ${packages.length} runtime packages.`);
