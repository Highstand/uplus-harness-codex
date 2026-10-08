import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function read(root, file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
export function exists(root, file) { return fs.existsSync(path.join(root, file)); }
export function files(root, dir) {
  if (!exists(root, dir)) return [];
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const name = path.posix.join(dir, e.name);
    if (e.isSymbolicLink()) throw new Error(`심볼릭 링크는 검사할 수 없습니다: ${name}`);
    return e.isDirectory() ? files(root, name) : [name];
  }).sort();
}
export function sources(root) {
  return ['app', 'components', 'lib'].flatMap(d => files(root, d))
    .filter(f => /\.(?:[cm]?[jt]sx?|css|json|svg)$/.test(f));
}
export function hash(text) { return createHash('sha256').update(text).digest('hex'); }
export function report(result) {
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
export function isMain(url) { return process.argv[1] && fileURLToPath(url) === path.resolve(process.argv[1]); }
