import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../checks/common.mjs';
import { generateCSS } from '../checks/tokens.mjs';

fs.mkdirSync(path.join(ROOT, 'app'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'app/tokens.css'), generateCSS());
console.log('Generated app/tokens.css from docs/tokens.json');
