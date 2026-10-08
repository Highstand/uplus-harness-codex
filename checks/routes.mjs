import path from 'node:path';
import { ROOT, read, files, report, isMain } from './common.mjs';

export function checkRoutes(root = ROOT) {
  const doc = read(root, 'docs/screens.md');
  const sections = doc.split(/^## /m).slice(1);
  const errors = [];
  const expected = sections.map(section => {
    const route = section.match(/### 라우트\s+`([^`]+)`/)?.[1];
    if (!route) errors.push(`주소 누락: ${section.split('\n')[0]}`);
    return route?.replace(/:([A-Za-z]\w*)/g, '[$1]');
  }).filter(Boolean).sort();
  const pageFiles = files(root, 'app').filter(f => /\/page\.(tsx|ts|jsx|js)$/.test(f));
  const actual = pageFiles.map(f => {
    const parts = path.posix.dirname(f).split('/').slice(1);
    if (parts.some(p => p.startsWith('@') || p.startsWith('(.'))) errors.push(`병렬·가로채기 주소는 이번 범위 밖: ${f}`);
    return '/' + parts.filter(p => !/^\([^)]*\)$/.test(p)).join('/');
  }).sort();
  if (sections.length !== 5 || pageFiles.length !== sections.length) errors.push(`화면 ${sections.length}개 / 페이지 ${pageFiles.length}개: 둘 다 5개여야 합니다.`);
  if (new Set(actual).size !== actual.length) errors.push('중복 페이지 주소가 있습니다.');
  if (new Set(expected).size !== expected.length) errors.push('문서 주소가 중복되었습니다.');
  if (JSON.stringify(expected) !== JSON.stringify(actual)) errors.push('문서 주소와 실제 페이지 주소가 다릅니다.');
  if (files(root, 'src/app').length || files(root, 'pages').length || files(root, 'src/pages').length) errors.push('페이지는 루트 app/에서만 관리합니다.');
  return { ok: errors.length === 0, expected, actual, errors };
}
if (isMain(import.meta.url)) report(checkRoutes());
