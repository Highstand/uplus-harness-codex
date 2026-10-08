import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, exists, read, files, hash, isMain } from './common.mjs';
import { checkRoutes } from './routes.mjs';
import { checkTokens } from './tokens.mjs';
import { checkImplementation } from './implementation.mjs';

export const PHASES = ['PRD 읽기', '페이지 분해', 'Design.md·토큰 적용', '화면 구현', '검증'];
export const AGENTS = ['requirements-reader', 'page-planner', 'design-applier', 'screen-builder', 'review-judge'];
export function initialState() {
  return { version: 1, phase: 1, status: 'ready', announced: false, commitRequired: false, gates: {}, rerun: [], message: '아직 어떤 페이즈도 실행하지 않았습니다.' };
}
export function loadState(root = ROOT) {
  return exists(root, 'work/progress.json') ? JSON.parse(read(root, 'work/progress.json')) : initialState();
}
function save(root, state) {
  fs.mkdirSync(path.join(root, 'work'), { recursive: true });
  fs.writeFileSync(path.join(root, 'work/progress.json'), JSON.stringify(state, null, 2) + '\n');
}
function digest(root, list) {
  return hash([...new Set(list)].sort().map(f => f + ':' + (exists(root, f) ? hash(read(root, f)) : 'MISSING')).join('\n'));
}
export function fingerprint(root, phase) {
  const pages = files(root, 'app').filter(f => /\/page\.[jt]sx?$/.test(f));
  const groups = {
    1: ['docs/PRD.md', 'AGENTS.md', 'work/01-requirements.md'],
    2: ['docs/screens.md', 'reference/flow chart.png', 'work/02-pages.md'],
    3: ['docs/Design.md', 'docs/tokens.json', 'app/tokens.css', 'app/globals.css', 'app/layout.tsx', 'scripts/generate-tokens.mjs', ...files(root, 'components/ui')],
    4: [...pages, ...files(root, 'components').filter(f => !f.startsWith('components/ui/')), ...files(root, 'lib'), ...files(root, 'reference/make-export'), 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'eslint.config.mjs', 'postcss.config.mjs'],
    5: ['work/05-review.md'],
  };
  return hash(digest(root, groups[phase]) + (phase === 2 ? JSON.stringify(pages) : ''));
}
function invalidate(state, phase, reason) {
  for (let i = phase; i <= 5; i++) delete state.gates[i];
  Object.assign(state, { phase, status: 'ready', announced: false, commitRequired: false, rerun: Array.from({ length: 6 - phase }, (_, i) => phase + i), message: reason });
}
export function reconcile(root, state) {
  for (let i = 1; i <= 5; i++) {
    const gate = state.gates[i];
    if (gate && ['passed', 'awaiting_approval'].includes(gate.status) && gate.fingerprint !== fingerprint(root, i)) {
      invalidate(state, i, `페이즈 ${i}의 입력 또는 결과가 바뀌었습니다. 이후 게이트도 다시 통과해야 합니다.`);
      break;
    }
  }
  return state;
}
function response(state, extra = {}) {
  return { phase: state.phase, name: PHASES[state.phase - 1] ?? '완료', agent: AGENTS[state.phase - 1] ?? null, status: state.status, message: state.message, ...extra };
}
function requirePredecessors(state) {
  for (let i = 1; i < state.phase; i++) if (state.gates[i]?.status !== 'passed') throw new Error(`페이즈 ${i} 게이트 통과가 필요합니다.`);
}
export function transition(root, command, { userText = '', phase, reason = '' } = {}) {
  const state = reconcile(root, loadState(root));
  const finish = (code, extra) => { save(root, state); return { code, ...response(state, extra) }; };
  if (command === 'status') return finish(0);
  if (command === 'start') {
    state.announced = true;
    state.message = state.commitRequired ? '게이트는 통과했지만 커밋이 남았습니다. 다음 페이즈를 실행하지 마세요.'
      : state.status === 'awaiting_approval' ? '사람 검수 승인 대기입니다. 결과를 보여주고 멈추세요.'
      : state.status === 'complete' ? '모든 페이즈가 완료됐습니다.'
      : `페이즈 ${state.phase}: ${PHASES[state.phase - 1]}. 실행하지 말고 “진행해”를 기다리세요.`;
    return finish(0, { executed: false });
  }
  if (command === 'reopen') {
    if (!Number.isInteger(phase) || phase < 1 || phase > 5 || !reason) throw new Error('reopen에는 1~5 페이즈 번호와 변경 이유가 필요합니다.');
    const earliest = Math.min(phase, state.phase);
    invalidate(state, earliest, reason);
    return finish(0, { executed: false });
  }
  if (command === 'proceed') {
    requirePredecessors(state);
    if (userText.trim() !== '진행해') throw new Error('사용자가 “진행해”라고 말한 경우에만 시작할 수 있습니다.');
    if (!state.announced || !['ready', 'failed'].includes(state.status) || state.commitRequired) throw new Error('페이즈를 먼저 안내하거나 현재 게이트·커밋을 완료하세요.');
    state.status = 'running'; state.announced = false;
    state.message = `현재 ${AGENTS[state.phase - 1]} 에이전트 1개만 호출하세요. 결과를 받은 뒤 gate를 실행하고 멈추세요.`;
    return finish(0, { executeOnePhase: true });
  }
  if (command === 'gate') {
    requirePredecessors(state);
    if (state.status !== 'running') throw new Error('실행 중인 페이즈만 판정할 수 있습니다.');
    let result;
    if ([1, 5].includes(state.phase)) {
      const f = state.phase === 1 ? 'work/01-requirements.md' : 'work/05-review.md';
      result = { ok: exists(root, f) && read(root, f).trim().length > 0, errors: [] };
      if (!result.ok) result.errors.push(`산출물 없음: ${f}`);
    } else if (state.phase === 2) result = checkRoutes(root);
    else if (state.phase === 3) result = checkTokens(root);
    else result = checkImplementation(root);
    const human = [1, 5].includes(state.phase);
    state.status = !result.ok ? 'failed' : human ? 'awaiting_approval' : 'passed';
    state.commitRequired = state.status === 'passed';
    state.announced = state.status === 'failed';
    state.gates[state.phase] = { status: state.status, fingerprint: fingerprint(root, state.phase), result };
    state.message = state.status === 'failed' ? '게이트 실패. 원인과 돌아갈 지점을 보여주고 멈추세요.'
      : human ? '사람 검수 대기. 결과를 보여주고 명시적 승인을 기다리세요. 다음 페이즈 실행 금지.'
      : '게이트 통과. 이 페이즈를 커밋하고 결과를 보여준 뒤 멈추세요.';
    return finish(human && result.ok ? 2 : result.ok ? 0 : 1, { result });
  }
  if (command === 'approve') {
    if (![1, 5].includes(state.phase) || state.status !== 'awaiting_approval') throw new Error('승인 대기 중인 사람 게이트가 없습니다.');
    if (!['승인', '확인', '통과', `${state.phase}단계 승인`].includes(userText.trim())) throw new Error('실제 사용자 승인 문구를 기록하세요. “진행해”는 검수 승인이 아닙니다.');
    state.gates[state.phase].status = 'passed'; state.gates[state.phase].approval = userText.trim();
    state.status = 'passed'; state.commitRequired = true;
    state.message = '사람 승인 기록 완료. 커밋 후 멈추세요. 다음 페이즈 자동 실행 금지.';
    return finish(0);
  }
  if (command === 'commit') {
    if (state.status !== 'passed' || !state.commitRequired) throw new Error('통과한 현재 페이즈만 커밋할 수 있습니다.');
    const git = args => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (git(['rev-parse', '--show-toplevel']).stdout.trim() !== root) throw new Error('이 폴더의 Git 저장소가 필요합니다.');
    if (git(['diff', '--cached', '--name-only']).stdout.trim()) throw new Error('이미 스테이징된 변경이 있습니다. 섞어 커밋하지 말고 확인하세요.');
    const p = state.phase;
    const before = JSON.stringify(state);
    const allowed = {
      1: ['work/01-requirements.md'],
      2: ['work/02-pages.md', ':(glob)app/**/page.tsx', 'app/page.tsx'],
      3: ['docs/tokens.json', 'app/tokens.css', 'app/globals.css', 'app/layout.tsx', 'components/ui', 'scripts/generate-tokens.mjs', 'checks/phase.mjs', 'checks/selftest.mjs'],
      4: ['app', 'components', 'lib'],
      5: ['work/05-review.md'],
    }[p];
    // Select only tracked or existing paths, including deletions, without staging docs/reference.
    const candidates = git(['ls-files', '--cached', '--others', '--exclude-standard', '--', ...allowed]).stdout.split('\n').filter(Boolean);
    state.commitRequired = false; state.phase = p + 1; state.status = p === 5 ? 'complete' : 'ready'; state.announced = false;
    state.rerun = state.rerun.filter(n => n > p); state.message = '현재 페이즈 완료. 다음 페이즈는 안내 후 “진행해”를 기다리세요.';
    save(root, state);
    let result = git(['add', '--', ...new Set([...candidates, 'work/progress.json'])]);
    if (result.status === 0) result = git(['commit', '-m', `harness: phase ${p} ${PHASES[p - 1]}`]);
    if (result.status !== 0) { save(root, JSON.parse(before)); throw new Error(`커밋 실패. 진행하지 마세요. ${result.stderr}`); }
    return { code: 0, ...response(state), commit: git(['rev-parse', 'HEAD']).stdout.trim() };
  }
  throw new Error(`지원하지 않는 명령: ${command}`);
}
if (isMain(import.meta.url)) {
  const [command = 'status', ...args] = process.argv.slice(2);
  const at = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
  try {
    const result = transition(ROOT, command, { userText: at('--user-text'), phase: Number(at('--phase')), reason: at('--reason') });
    console.log(JSON.stringify(result, null, 2)); process.exitCode = result.code;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
