#!/usr/bin/env node
/*
 * 1 ファイル版をつくる。
 *   node tools/build.mjs                 → dist/otona-shakai.html（CSS・JS・データをすべて埋め込んだ単体 HTML）
 *   node tools/build.mjs --fragment OUT  → <html>/<head>/<body> を含まない断片（埋め込み用）
 * index.html の <link rel="stylesheet" href="assets/..."> と <script src="..."> を中身で置き換える。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const outArg = args.find((a) => !a.startsWith('--'));
const out = path.resolve(outArg || path.join(root, 'dist', 'otona-shakai.html'));

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('index.html');

const css = read('assets/css/style.css');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts
  .map((src) => `/* ${src} */\n` + read(src).replace(/<\/script/gi, '<\\/script'))
  .join('\n');
const icon = 'data:image/svg+xml;base64,' + Buffer.from(read('assets/icons/icon.svg')).toString('base64');

const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const body = html
  .match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/\s*<!--[\s\S]*?-->/g, '')
  .replace(/\s*<script src="[^"]+"><\/script>/g, '')
  .trim();
const inlineScript = `<script>\nwindow.LEARN_STANDALONE = true;\n${js}\n</script>`;

let result;
if (fragment) {
  result = [title, `<style>\n${css}\n</style>`, body, inlineScript].join('\n');
} else {
  result = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${title}
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
${css}
</style>
</head>
<body>
${body}
${inlineScript}
</body>
</html>
`;
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result);
console.log(`${path.relative(root, out) || out}  ${(Buffer.byteLength(result) / 1024).toFixed(0)} KB（スクリプト ${scripts.length} 本を埋め込み）`);
