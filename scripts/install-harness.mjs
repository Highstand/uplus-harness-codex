// Run by the user from a terminal where .codex/ and .git/ are writable.
// Never run this to evade the active agent sandbox. --check is read-only.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, read, exists } from '../checks/common.mjs';

const agents = ['requirements-reader', 'page-planner', 'design-applier', 'screen-builder', 'review-judge'];
const copies = agents.map(name => [`work/setup/agents/${name}.toml`, `.codex/agents/${name}.toml`]);
copies.push(['work/setup/config.toml', '.codex/config.toml']);
// Hooks are copied last, after agents, scripts, and AGENTS.md are present.
copies.push(['work/setup/hooks.json', '.codex/hooks.json']);
for (const file of ['AGENTS.md', 'checks/hook.mjs', 'checks/phase.mjs', 'checks/routes.mjs', 'checks/tokens.mjs', 'checks/implementation.mjs', 'package.json', 'work/progress.json']) {
  if (!exists(ROOT, file)) throw new Error(`설치에 필요한 파일이 없습니다: ${file}`);
}
for (const [source, destination] of copies) {
  if (!exists(ROOT, source)) throw new Error(`설치 원본 없음: ${source}`);
  if (exists(ROOT, destination) && read(ROOT, source) !== read(ROOT, destination)) throw new Error(`기존 설정을 덮어쓰지 않습니다: ${destination}`);
}
if (process.argv.includes('--check')) {
  console.log(JSON.stringify({ ok: true, mode: 'read-only', files: copies.map(([, target]) => ({ target, installed: exists(ROOT, target) })) }, null, 2));
} else if (process.argv.includes('--install')) {
  const git = args => {
    const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} 실패: ${result.stderr}`);
    return result.stdout.trim();
  };
  if (!exists(ROOT, '.git')) git(['init']);
  if (git(['rev-parse', '--show-toplevel']) !== ROOT) throw new Error('현재 폴더의 저장소가 아닙니다.');
  git(['var', 'GIT_AUTHOR_IDENT']);
  git(['var', 'GIT_COMMITTER_IDENT']);
  if (git(['diff', '--cached', '--name-only'])) throw new Error('스테이징된 변경이 있습니다. 설치 커밋과 섞지 않도록 먼저 확인하세요.');
  const check = spawnSync(process.execPath, ['checks/selftest.mjs'], { cwd: ROOT, encoding: 'utf8' });
  if (check.status !== 0) throw new Error(`하네스 검사 실패: ${check.stdout}${check.stderr}`);
  for (const [source, destination] of copies) {
    if (exists(ROOT, destination)) continue;
    fs.mkdirSync(path.dirname(path.join(ROOT, destination)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, source), path.join(ROOT, destination), fs.constants.COPYFILE_EXCL);
    console.log(`설치: ${destination}`);
  }
  const targets = ['.codex', '.gitignore', 'AGENTS.md', 'app', 'checks', 'scripts', 'work', 'package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'eslint.config.mjs', 'postcss.config.mjs', 'docs', 'reference'];
  git(['add', '--', ...targets]);
  if (git(['diff', '--cached', '--name-only'])) git(['commit', '-m', 'chore: prepare classroom Codex harness']);
  console.log('설치 완료. 새 Codex 세션에서 /hooks로 훅을 검토·승인한 뒤 “페이즈 1 시작”이라고 입력하세요.');
} else {
  console.log('읽기 전용 확인: node scripts/install-harness.mjs --check\n사용자 터미널에서 설치: node scripts/install-harness.mjs --install');
}
