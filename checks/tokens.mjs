import { ROOT, read, sources, report, isMain, hash } from './common.mjs';

export function tokenName(t) { return '--' + `${t.collection}/${t.name}`.replace(/[^a-zA-Z0-9-]/g, '-'); }
export function tokenKind(t) {
  if (t.type === 'color') return t.collection === 'semantic' ? 'color' : 'primitive';
  if (/font-family/.test(t.name)) return 'family';
  if (/font-size/.test(t.name)) return 'font-size';
  if (/line-height|lineHeight|leading/.test(t.name)) return 'line-height';
  if (/font-weight|fontWeight/.test(t.name)) return 'font-weight';
  if (t.collection === 'spacing') return 'spacing';
  if (t.collection === 'radius') return 'radius';
  if (/size|dimension/.test(t.collection) || /WIDTH_HEIGHT/.test(t.scopes?.join(' '))) return 'size';
  return 'other';
}
export function loadTokens(root = ROOT) {
  const doc = JSON.parse(read(root, 'docs/tokens.json'));
  const tokens = doc.tokens;
  if (!Array.isArray(tokens) || !tokens.length) throw new Error('tokens.json에 tokens 배열이 필요합니다.');
  const byId = new Map(tokens.map(t => [`${t.collection}/${t.name}`, t]));
  function value(t, stack = []) {
    const id = `${t.collection}/${t.name}`;
    if (stack.includes(id)) throw new Error(`토큰 순환 참조: ${id}`);
    const v = t.values?.[doc.meta?.defaultMode ?? 'Default'];
    if (v && typeof v === 'object' && v.alias) {
      const target = byId.get(v.alias);
      if (!target) throw new Error(`없는 토큰 참조: ${v.alias}`);
      const resolved = value(target, [...stack, id]);
      if (v.resolved !== undefined && String(v.resolved).toLowerCase() !== String(resolved).toLowerCase()) throw new Error(`토큰 resolved 값 불일치: ${id}`);
      return resolved;
    }
    if (typeof v !== 'number' && typeof v !== 'string') throw new Error(`값 없는 토큰: ${id}`);
    return v;
  }
  const map = new Map();
  for (const t of tokens) {
    const name = tokenName(t);
    if (map.has(name)) throw new Error(`토큰 이름 충돌: ${name}`);
    map.set(name, { ...t, kind: tokenKind(t), value: value(t) });
  }
  return map;
}
export function generateCSS(root = ROOT) {
  const map = loadTokens(root);
  return '/* Generated from docs/tokens.json. Do not edit. */\n:root {\n' + [...map].map(([name, t]) => {
    let v = t.value;
    if (t.kind === 'family') v = JSON.stringify(v);
    else if (typeof v === 'number' && t.kind !== 'font-weight') v = `${v}px`;
    return `  ${name}: ${v};`;
  }).join('\n') + '\n}\n';
}
export function coverageErrors(root = ROOT, map = loadTokens(root)) {
  const errors = [];
  const has = (kind, n) => [...map.values()].some(t => t.kind === kind && t.value === n);
  const design = read(root, 'docs/Design.md');
  const missing = new Set();
  for (const m of design.matchAll(/\|\s*`[^`]+`\s*\|\s*(\d+)\s*\/\s*(\d+)px\s*\|[^|]*\((\d+)\)/g)) {
    for (const [i, kind] of [[1, 'font-size'], [2, 'line-height'], [3, 'font-weight']]) {
      if (!has(kind, Number(m[i]))) missing.add(`${kind}: ${m[i]}`);
    }
  }
  for (const kind of ['line-height', 'font-weight']) if (![...map.values()].some(t => t.kind === kind)) missing.add(`${kind}: 토큰 종류 전체 없음`);
  // Documented fixed component dimensions must have a size/spacing token too.
  for (const line of design.split('\n').filter(s => /크기:|높이:|Header.*높이|주요 버튼/.test(s))) {
    for (const m of line.matchAll(/(\d+)\s*(?:×|px)/g)) {
      const n = Number(m[1]);
      if (!has('size', n) && !has('spacing', n)) missing.add(`size: ${n}px`);
    }
  }
  for (const item of missing) errors.push(`Design.md에 필요한 토큰 누락 — ${item}. docs/는 수정하지 말고 사용자에게 보고하세요.`);
  return errors;
}

function propertyKind(prop) {
  if (/^(?:color|background(?:-color)?|.*-color|fill|stroke)$/.test(prop)) return 'color';
  if (prop === 'font-family') return 'family';
  if (prop === 'font-size') return 'font-size';
  if (prop === 'font-weight') return 'font-weight';
  if (prop === 'line-height') return 'line-height';
  if (/radius/.test(prop)) return 'radius';
  if (/^(?:padding|margin|gap|row-gap|column-gap|inset|top|bottom|left|right|letter-spacing|word-spacing|border-spacing)/.test(prop)) return 'spacing';
  if (/(?:width|height|size|basis|offset|thickness)$/.test(prop)) return 'size';
  return null;
}
const structural = new Set(('block inline inline-block flex inline-flex grid hidden relative absolute fixed sticky static flex-row flex-col flex-wrap flex-nowrap items-start items-center items-end items-stretch justify-start justify-center justify-end justify-between overflow-auto overflow-hidden overflow-y-auto overflow-x-auto box-border text-left text-center text-right truncate whitespace-nowrap cursor-pointer cursor-default select-none pointer-events-none pointer-events-auto').split(' '));
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, ''); }

export function sourceErrors(file, source, map, knownClasses = new Set()) {
  // Original Figma asset from Input 1:754. Its authored SVG colors and geometry
  // must stay intact; this exception never permits hand-written styles or edits.
  if (file === 'components/ui/input-error.svg') {
    return hash(source) === '31b87370274eb0feeefd22a1e4ad825b023e58dd90e2d5f1bd343797ddc99fd5'
      ? [] : [`${file}: Figma 원본 자산과 다릅니다. 원본 SVG를 변경할 수 없습니다.`];
  }
  const errors = [];
  const add = message => errors.push(`${file}: ${message}`);
  const s = stripComments(source);
  if (file === 'app/tokens.css') return errors;
  if (/#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/i.test(s) || /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/i.test(s)) add('색상 직접 입력 금지. semantic 토큰을 사용하세요.');
  for (const match of s.matchAll(/var\(\s*(--[\w-]+)\s*([^)]*)\)/g)) {
    if (!map.has(match[1])) add(`없는 토큰: ${match[1]}`);
    if (match[2].trim()) add('토큰 fallback이나 계산식으로 임의 값을 추가할 수 없습니다.');
  }
  if (/\.css$/.test(file)) {
    if (/--[\w-]+\s*:/.test(s)) add('사용자 정의 CSS 변수 선언은 금지합니다. tokens.css만 생성하세요.');
    if (/@(?:apply|theme|utility|plugin|config)\b/.test(s)) add('우회 스타일 지시문은 금지합니다. 명시적인 CSS 선언을 사용하세요.');
    for (const m of s.matchAll(/@import\s+([^;]+);/g)) {
      if (!/^['"](?:tailwindcss|\.\/tokens\.css)['"]$/.test(m[1].trim())) add('스타일 import는 tailwindcss와 ./tokens.css만 허용합니다.');
    }
    for (const m of s.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
      const prop = m[1]; const val = m[2].trim(); const kind = propertyKind(prop);
      const refs = [...val.matchAll(/var\((--[\w-]+)\)/g)].map(x => x[1]);
      const remainder = val.replace(/var\(--[\w-]+\)/g, '').trim();
      const layout = /^(?:margin|padding|gap|row-gap|column-gap|inset|top|left|right|bottom|.*width|.*height|.*size|flex-basis)/.test(prop) && !/^font/.test(prop);
      const bareOK = layout && /^(?:0|auto|100%)(?:\s+(?:0|auto|100%))*$/.test(val);
      if (kind) {
        if (!bareOK && (!refs.length || remainder)) add(`${prop}: ${val} — 토큰만 허용합니다.`);
        for (const ref of refs) {
          const t = map.get(ref);
          if (t && t.kind !== kind && !(kind === 'size' && t.kind === 'spacing')) add(`${prop}에 ${t.kind} 토큰을 사용할 수 없습니다: ${ref}`);
        }
      } else if (/^(?:font|border|outline|box-shadow|text-shadow|filter|transform|background-image)$/.test(prop)) {
        add(`${prop} 축약·효과 속성은 이번 검사 범위에서 허용하지 않습니다. 속성을 나누거나 누락을 보고하세요.`);
      } else if (/[\d#]/.test(remainder)) add(`${prop}: 토큰 밖 숫자 값 금지 (${val})`);
    }
    for (const m of s.matchAll(/@(?:media|container)[^{]*\b([\d.]+(?:px|rem|em|vw|vh))\b/g)) add(`토큰 밖 반응형 크기 금지: ${m[1]}`);
  } else if (/\.[cm]?[jt]sx?$/.test(file)) {
    if (/\bstyle\s*=|\.style\b|styled\s*[.(]|\bcss\s*`|<style\b|dangerouslySetInnerHTML/.test(s)) add('인라인·동적 스타일 대신 CSS 파일과 정적 className을 사용하세요.');
    if (/className\s*=\s*\{/.test(s)) add('className은 정적 문자열로 작성하세요. 상태별 스타일은 data-* 또는 aria-* 선택자를 사용하세요.');
    for (const m of s.matchAll(/className\s*=\s*["']([^"']*)["']/g)) {
      for (const cls of m[1].split(/\s+/).filter(Boolean)) {
        if (!structural.has(cls) && !knownClasses.has(cls)) add(`검증되지 않은 클래스: ${cls}. CSS에서 토큰으로 정의하세요.`);
      }
    }
    if (/\b(?:width|height|size|strokeWidth|fontSize|fontWeight|fill|stroke)\s*=/.test(s)) add('직접 크기·색상 속성 대신 토큰 CSS를 사용하세요.');
  } else if (/\.svg$/.test(file) && /\b(?:fill|stroke|width|height)\s*=/.test(s)) add('SVG 크기·색상도 토큰 CSS로 지정하세요.');
  return errors;
}
export function checkTokens(root = ROOT, { coverage = true, generated = true, overrides = new Map() } = {}) {
  const map = loadTokens(root);
  const errors = coverage ? coverageErrors(root, map) : [];
  const all = new Map(sources(root).map(f => [f, read(root, f)]));
  for (const [f, content] of overrides) { if (content === null) all.delete(f); else all.set(f, content); }
  const knownClasses = new Set([...all].filter(([f]) => /\.css$/.test(f)).flatMap(([, s]) => [...stripComments(s).matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1])));
  for (const [file, content] of all) errors.push(...sourceErrors(file, content, map, knownClasses));
  const actualCSS = all.get('app/tokens.css');
  if ((generated || actualCSS !== undefined) && actualCSS !== generateCSS(root)) errors.push('app/tokens.css가 원본 생성 결과와 다릅니다. node scripts/generate-tokens.mjs를 실행하세요.');
  return { ok: errors.length === 0, errors };
}
if (isMain(import.meta.url)) {
  if (process.argv.includes('--coverage-only')) { const errors = coverageErrors(); report({ ok: !errors.length, errors }); }
  else report(checkTokens());
}
