import { spawnSync } from 'node:child_process';
import { ROOT, read, sources, report, isMain } from './common.mjs';
import { checkTokens } from './tokens.mjs';
import { checkRoutes } from './routes.mjs';

export function checkCopy(root = ROOT) {
  const errors = [];
  for (const file of sources(root)) {
    for (const term of ['할인가', '프로모션가']) {
      if (read(root, file).includes(term)) errors.push(`${file}: 금지 문구 “${term}” 발견 (R1-4)`);
    }
  }
  return { ok: !errors.length, errors };
}
export function checkImplementation(root = ROOT) {
  const results = [checkRoutes(root), checkTokens(root), checkCopy(root)];
  // Fail early; never report a build/lint pass when they were not run.
  if (results.some(r => !r.ok)) return { ok: false, errors: results.flatMap(r => r.errors), build: 'not-run', lint: 'not-run' };
  const run = name => {
    const result = spawnSync('npm', ['run', name], { cwd: root, encoding: 'utf8', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, timeout: 180000 });
    return { ok: result.status === 0, output: (result.stdout ?? '') + (result.stderr ?? ''), error: result.error?.message };
  };
  const build = run('build'); const lint = run('lint');
  return { ok: build.ok && lint.ok, build, lint, errors: [!build.ok && '빌드 실패', !lint.ok && 'lint 실패'].filter(Boolean) };
}
if (isMain(import.meta.url)) report(checkImplementation());
