import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, read } from './common.mjs';
import { checkRoutes } from './routes.mjs';
import { checkTokens, generateCSS, loadTokens, sourceErrors } from './tokens.mjs';
import { checkCopy } from './implementation.mjs';
import { transition, initialState, loadState, fingerprint } from './phase.mjs';
import { evaluateHook, projectedPatch } from './hook.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'uplus-harness-test-'));
const results = [];
const write = (file, content) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content); };
const state = value => write('work/progress.json', JSON.stringify(value));
const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } };
const routePaths = ['plans', 'plans/[planId]', 'plans/[planId]/confirm', 'plans/[planId]/apply', 'subscriptions/complete'];
try {
  for (const f of ['PRD.md', 'screens.md', 'Design.md', 'tokens.json']) write(`docs/${f}`, read(ROOT, `docs/${f}`));
  write('AGENTS.md', 'Fixture rules');
  write('reference/flow chart.png', 'fixture');
  for (const dir of routePaths) write(`app/${dir}/page.tsx`, 'export default function Page() { return <main />; }\n');
  write('app/tokens.css', generateCSS(root));
  write('app/globals.css', '.demo { color: var(--semantic-text-primary); padding: var(--spacing-spacing-16); width: 100%; margin: 0 auto; }\n');
  const map = loadTokens(root);
  test('화면 5개와 주소 5개 일치', () => assert.equal(checkRoutes(root).ok, true));
  test('주소가 다른 5개도 실패', () => {
    fs.renameSync(path.join(root, 'app/plans/[planId]/confirm'), path.join(root, 'app/plans/[planId]/wrong'));
    assert.equal(checkRoutes(root).ok, false);
    fs.renameSync(path.join(root, 'app/plans/[planId]/wrong'), path.join(root, 'app/plans/[planId]/confirm'));
  });
  test('여섯 번째 페이지는 실패', () => { write('app/page.tsx', 'export default function Home() { return null; }'); assert.equal(checkRoutes(root).ok, false); fs.unlinkSync(path.join(root, 'app/page.tsx')); });
  test('semantic 토큰과 배치 값은 통과', () => assert.equal(checkTokens(root, { coverage: false }).ok, true));
  for (const [name, source] of [
    ['hex', '.x { color: #ffffff; }'], ['rgb', '.x { color: rgb(0,0,0); }'],
    ['색상 이름', '.x { color: red; }'], ['토큰과 같은 직접 숫자', '.x { padding: 16px; }'],
    ['토큰 밖 반경', '.x { border-radius: 15px; }'], ['직접 굵기', '.x { font-weight: 500; }'],
    ['직접 줄높이', '.x { line-height: 24px; }'], ['primitive 색상', '.x { color: var(--primitive-gray-900); }'],
    ['다른 종류 토큰', '.x { line-height: var(--spacing-spacing-24); }'], ['없는 변수', '.x { color: var(--fake); }'],
    ['fallback', '.x { color: var(--semantic-text-primary, red); }'], ['재정의', ':root { --semantic-text-primary: red; }'],
  ]) test(`${name} 위반 차단`, () => assert.ok(sourceErrors('app/test.css', source, map).length));
  test('임의 Tailwind 클래스 차단', () => assert.ok(sourceErrors('app/test.tsx', '<div className="p-4 text-red-500" />', map).length));
  test('인라인 스타일 차단', () => assert.ok(sourceErrors('app/test.tsx', '<div style={{fontWeight: 500}} />', map).length));
  test('생성 CSS의 hex는 제외되고 원본 일치로 통과', () => assert.equal(checkTokens(root, { coverage: false }).ok, true));
  test('생성 CSS 변조는 실패', () => { write('app/tokens.css', generateCSS(root) + '/* tampered */'); assert.equal(checkTokens(root, { coverage: false }).ok, false); write('app/tokens.css', generateCSS(root)); });
  test('줄높이·굵기 누락은 3단계 실패', () => {
    const original = read(root, 'docs/tokens.json');
    const fixture = JSON.parse(original);
    fixture.tokens = fixture.tokens.filter(t => !/line-height|font-weight/.test(t.name));
    write('docs/tokens.json', JSON.stringify(fixture));
    try {
      const result = checkTokens(root);
      assert.equal(result.ok, false);
      assert.ok(result.errors.some(e => e.includes('line-height')));
      assert.ok(result.errors.some(e => e.includes('font-weight')));
    } finally { write('docs/tokens.json', original); }
  });
  test('R1 금지 문구 위반 실패; 문서 제외', () => { assert.equal(checkCopy(root).ok, true); write('lib/copy.ts', 'export const label = "할인가";'); assert.equal(checkCopy(root).ok, false); fs.unlinkSync(path.join(root, 'lib/copy.ts')); });
  test('안내 없이 진행 불가', () => { state(initialState()); assert.throws(() => transition(root, 'proceed', { userText: '진행해' })); });
  test('시작은 안내만 하고 실행하지 않음', () => { state(initialState()); const result = transition(root, 'start'); assert.equal(result.executed, false); assert.equal(result.status, 'ready'); assert.equal(result.phase, 1); });
  test('진행해 이후 1단계 사람 게이트에서 정지', () => {
    transition(root, 'proceed', { userText: '진행해' });
    write('work/01-requirements.md', '# 목표\n실습용 요구사항 결과');
    const result = transition(root, 'gate');
    assert.equal(result.code, 2); assert.equal(result.phase, 1); assert.equal(result.status, 'awaiting_approval');
    assert.throws(() => transition(root, 'proceed', { userText: '진행해' }));
    assert.throws(() => transition(root, 'approve', { userText: '진행해' }));
  });
  test('사람 승인 뒤에도 커밋 전 다음 페이즈 불가', () => {
    transition(root, 'approve', { userText: '승인' });
    assert.equal(loadState(root).commitRequired, true); assert.equal(loadState(root).phase, 1);
    assert.throws(() => transition(root, 'proceed', { userText: '진행해' }));
  });
  test('입력 변경 시 가장 이른 단계부터 이후 판정 무효', () => {
    const s = initialState(); s.phase = 3; s.gates = { 1: { status: 'passed', fingerprint: fingerprint(root, 1) }, 2: { status: 'passed', fingerprint: fingerprint(root, 2) } }; state(s);
    write('docs/PRD.md', read(root, 'docs/PRD.md') + '\n변경');
    const result = transition(root, 'start'); assert.equal(result.phase, 1); assert.deepEqual(loadState(root).gates, {}); assert.deepEqual(loadState(root).rerun, [1,2,3,4,5]);
  });
  test('실행 전 에이전트 호출을 훅에서 거절', () => { state(initialState()); assert.equal(evaluateHook(root, { hook_event_name: 'PreToolUse', tool_name: 'spawn_agent', tool_input: {} }).hookSpecificOutput.permissionDecision, 'deny'); });
  test('실행 전 파일 쓰기를 훅에서 거절', () => { state(initialState()); const output = evaluateHook(root, { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Add File: work/01-requirements.md\n+new\n*** End Patch' } }); assert.equal(output.hookSpecificOutput.permissionDecision, 'deny'); });
  test('허용된 파일의 패치 통과, docs 수정 거절', () => {
    const s = initialState(); s.status = 'running'; state(s);
    const call = f => evaluateHook(root, { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: `*** Begin Patch\n*** Update File: ${f}\n@@\n-${read(root, f).split('\n')[0]}\n+changed\n*** End Patch` } });
    assert.deepEqual(call('work/01-requirements.md'), {}); assert.equal(call('docs/PRD.md').hookSpecificOutput.permissionDecision, 'deny');
  });
  test('추가될 hex를 쓰기 전에 훅에서 거절', () => {
    const s = initialState(); s.phase = 3; s.status = 'running'; state(s);
    const event = { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Add File: components/ui/test.css\n+.bad { color: #123456; }\n*** End Patch' } };
    assert.equal(evaluateHook(root, event).hookSpecificOutput.permissionDecision, 'deny');
  });
  test('멀티 파일 패치에서 토큰 생성 파일로 위장 금지', () => {
    const event = { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Begin Patch\n*** Add File: app/tokens.css\n+#123456\n*** End Patch' } };
    assert.equal(evaluateHook(root, event).hookSpecificOutput.permissionDecision, 'deny');
  });
  test('셸 쓰기 우회 차단', () => assert.equal(evaluateHook(root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'echo red > app/globals.css' } }).hookSpecificOutput.permissionDecision, 'deny'));
  test('PostToolUse가 이미 쓰인 위반도 발견', () => {
    write('app/invalid.css', '.x { color: #123456; }');
    assert.equal(evaluateHook(root, { hook_event_name: 'PostToolUse' }).decision, 'block'); fs.unlinkSync(path.join(root, 'app/invalid.css'));
  });
  test('페이즈 1 시작 프롬프트는 안내만 주입', () => assert.match(evaluateHook(root, { hook_event_name: 'UserPromptSubmit', prompt: '페이즈 1 시작' }).hookSpecificOutput.additionalContext, /안내만/));
  test('패치 경로 탈출 차단', () => assert.throws(() => projectedPatch(root, '*** Begin Patch\n*** Add File: ../outside\n+x\n*** End Patch')));
} finally { fs.rmSync(root, { recursive: true, force: true }); }
console.log(JSON.stringify({ ok: results.every(r => r.ok), passed: results.filter(r => r.ok).length, total: results.length, results }, null, 2));
process.exitCode = results.every(r => r.ok) ? 0 : 1;
