import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read, exists, isMain } from './common.mjs';
import { loadState, PHASES } from './phase.mjs';
import { checkTokens } from './tokens.mjs';

const deny = reason => ({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
const context = (event, text) => ({ hookSpecificOutput: { hookEventName: event, additionalContext: text } });

function normalize(root, name) {
  const absolute = path.resolve(root, name);
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  if (relative.startsWith('../') || relative === '..' || path.isAbsolute(relative)) throw new Error('프로젝트 밖 변경 금지');
  return relative;
}
export function projectedPatch(root, patch) {
  if (!patch.startsWith('*** Begin Patch\n') || !patch.includes('*** End Patch')) throw new Error('확인할 수 없는 패치 형식');
  const changes = new Map();
  const blocks = patch.split(/(?=^\*\*\* (?:Add|Update|Delete) File: )/m).slice(1);
  if (!blocks.length) throw new Error('패치에 변경 파일이 없습니다.');
  for (const block of blocks) {
    const lines = block.split('\n');
    const header = lines.shift().match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    const file = normalize(root, header[2]); const kind = header[1];
    if (kind === 'Delete') { changes.set(file, null); continue; }
    if (kind === 'Add') {
      if (exists(root, file)) throw new Error(`기존 파일에 Add 사용 금지: ${file}`);
      changes.set(file, lines.filter(l => l.startsWith('+')).map(l => l.slice(1)).join('\n') + '\n'); continue;
    }
    let target = file;
    if (lines[0]?.startsWith('*** Move to: ')) target = normalize(root, lines.shift().slice(13));
    let content = read(root, file).split('\n'); let cursor = 0; let old = []; let next = [];
    const flush = () => {
      if (!old.length && !next.length) return;
      let index = -1;
      for (let i = cursor; i <= content.length - old.length; i++) {
        if (old.every((v, j) => content[i + j] === v)) { index = i; break; }
      }
      if (index < 0 || !old.length) throw new Error(`문맥이 충분하지 않은 패치: ${file}`);
      content.splice(index, old.length, ...next); cursor = index + next.length; old = []; next = [];
    };
    for (const line of lines) {
      if (line.startsWith('@@') || line.startsWith('***')) { flush(); continue; }
      if (line.startsWith(' ') || line.startsWith('-')) old.push(line.slice(1));
      if (line.startsWith(' ') || line.startsWith('+')) next.push(line.slice(1));
    }
    flush(); changes.set(target, content.join('\n'));
    if (target !== file) changes.set(file, null);
  }
  return changes;
}
function allowedFile(file, state) {
  if (state.status !== 'running') return false;
  if (state.phase === 1) return file === 'work/01-requirements.md';
  if (state.phase === 2) return file === 'work/02-pages.md' || /^app\/(?:.*\/)?page\.tsx$/.test(file);
  if (state.phase === 3) return ['app/globals.css', 'app/layout.tsx', 'scripts/generate-tokens.mjs'].includes(file) || file.startsWith('components/ui/');
  if (state.phase === 4) return /^app\/(?:.*\/)?page\.tsx$/.test(file) || file.startsWith('lib/') || (file.startsWith('components/') && !file.startsWith('components/ui/'));
  return state.phase === 5 && file === 'work/05-review.md';
}
export function evaluateHook(root, event) {
  const state = loadState(root);
  if (event.hook_event_name === 'UserPromptSubmit') {
    const prompt = String(event.prompt ?? '').trim();
    if (prompt === '시작' || /^페이즈\s*[1-5]\s*시작$/.test(prompt)) return context('UserPromptSubmit', `안내만 하세요. node checks/phase.mjs start로 현재 페이즈를 확인하고 “진행해”를 기다립니다. 현재 기록: ${state.phase} ${PHASES[state.phase - 1] ?? '완료'}. 에이전트 호출과 구현 금지.`);
    if (prompt === '진행해') return context('UserPromptSubmit', 'node checks/phase.mjs proceed --user-text "진행해"가 허용한 현재 페이즈 1개만 담당 에이전트에 맡기세요. gate 결과를 보여주고 멈추세요. 이전 사람 게이트의 승인으로 해석하지 마세요.');
    return {};
  }
  if (event.hook_event_name === 'PostToolUse') {
    const result = checkTokens(root, { coverage: false, generated: false });
    return result.ok ? {} : { decision: 'block', reason: result.errors.join('\n'), hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '디자인 규칙 위반입니다. 다음 페이즈로 진행하지 말고 원인을 보고하세요. 이 검사는 이미 수행된 쓰기를 되돌리지 않습니다.' } };
  }
  if (event.hook_event_name !== 'PreToolUse') return {};
  const name = event.tool_name ?? '';
  const input = event.tool_input ?? {};
  if (['spawn_agent', 'Agent'].includes(name)) {
    if (state.status !== 'running') return deny('“진행해”를 받은 현재 페이즈만 실행할 수 있습니다.');
    return context('PreToolUse', `현재 페이즈 ${state.phase}의 담당만 호출하고 끝나면 게이트에서 멈추세요.`);
  }
  if (['apply_patch', 'Write', 'Edit'].includes(name)) {
    try {
      const patch = typeof input === 'string' ? input : input.command ?? input.patch ?? input.input;
      if (typeof patch !== 'string') return deny('패치 내용을 읽을 수 없습니다. apply_patch를 사용하세요.');
      const changes = projectedPatch(root, patch);
      for (const file of changes.keys()) {
        if (!allowedFile(file, state)) return deny(`현재 페이즈 ${state.phase}에서 수정할 수 없는 파일: ${file}`);
      }
      const result = checkTokens(root, { coverage: false, generated: false, overrides: new Map([...changes].filter(([f]) => /^(app|components|lib)\//.test(f))) });
      return result.ok ? {} : deny(result.errors.join('\n'));
    } catch (e) { return deny(e.message); }
  }
  if (['Bash', 'exec_command', 'shell', 'shell_command'].includes(name)) {
    const command = String(input.command ?? input.cmd ?? '').trim();
    // A small command surface keeps shell redirection from bypassing patch checks.
    // This is a classroom guardrail, not an OS sandbox or a general shell parser.
    if (/[\n;|&<>`]|\$\(/.test(command)) return deny('셸 조합·리다이렉션 대신 읽기 명령 1개 또는 apply_patch를 사용하세요.');
    if (/^node checks\/phase\.mjs(?:\s|$)/.test(command)) return {};
    if (/^node checks\/(?:routes|tokens|implementation|selftest)\.mjs(?:\s|$)/.test(command)) return {};
    if (command === 'node scripts/generate-tokens.mjs') return state.status === 'running' && state.phase === 3 ? {} : deny('토큰 생성은 실행 중인 페이즈 3에서만 허용합니다.');
    if (/^npm run (?:build|lint|dev)(?:\s|$)/.test(command)) return {};
    if (/^(?:pwd|ls|cat|rg|head|tail|wc)(?:\s|$)/.test(command)) return {};
    if (/^git (?:status|diff|log|show|rev-parse)(?:\s|$)/.test(command)) return {};
    return deny('이 하네스의 셸은 읽기·등록된 검사·토큰 생성만 허용합니다. 파일 변경은 apply_patch, 커밋은 node checks/phase.mjs commit을 사용하세요.');
  }
  return {};
}
if (isMain(import.meta.url)) {
  try {
    const event = JSON.parse(fs.readFileSync(0, 'utf8'));
    console.log(JSON.stringify(evaluateHook(ROOT, event)));
  } catch (e) { console.error(`하네스 훅 오류: ${e.message}`); process.exitCode = 2; }
}
