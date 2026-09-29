#!/usr/bin/env node
/*
 * コンテンツ検証スクリプト
 *   node tools/check.mjs            … data/ 以下すべて
 *   node tools/check.mjs politics   … 指定したファイルだけ（複数可）
 * エラーがあれば終了コード 1。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');

const OUTLINE = {
  politics: ['democracy', 'systems', 'constitution', 'rights', 'peace', 'diet', 'cabinet', 'courts', 'local', 'elections', 'international', 'world-issues'],
  economics: ['basics', 'market', 'firms', 'gdp', 'money', 'fiscal', 'postwar', 'labor', 'welfare', 'trade', 'global-economy', 'north-south', 'consumer'],
  ethics: ['adolescence', 'greek', 'judaism-christianity', 'islam', 'buddhism', 'china', 'japan-thought', 'modern-west', 'kant-hegel', 'utilitarianism', 'existentialism', 'modern-issues'],
  geography: ['maps', 'landforms', 'climate', 'agriculture', 'resources', 'industry', 'population', 'culture', 'asia', 'europe-russia', 'africa', 'americas', 'oceania', 'japan'],
  history: ['ancient-civilizations', 'greece-rome', 'china-dynasties', 'islamic-world', 'medieval-europe', 'renaissance', 'absolutism', 'revolutions', 'industrial', 'imperialism', 'ww1', 'interwar', 'ww2', 'cold-war', 'contemporary'],
  physics: ['motion', 'forces', 'gravity', 'energy', 'momentum', 'heat', 'waves', 'sound', 'light', 'electricity', 'magnetism', 'em-waves', 'nuclear'],
  chemistry: ['matter', 'states', 'atoms', 'bonds', 'mole', 'acids-bases', 'redox', 'batteries', 'inorganic', 'organic', 'polymers', 'daily-chemistry', 'environment'],
  biology: ['cells', 'metabolism', 'dna', 'cell-division', 'heredity', 'homeostasis', 'immunity', 'nervous', 'biotech', 'evolution', 'diversity', 'vegetation', 'ecosystems'],
  earth: ['earth-shape', 'plates', 'earthquakes', 'volcanoes', 'strata', 'earth-history', 'atmosphere', 'weather', 'ocean', 'climate-change', 'solar-system', 'stars', 'disasters']
};
const FIGS = ['sanken', 'supply-demand', 'business-cycle', 'circular-flow', 'maslow', 'dialectic', 'pop-pyramid', 'river-landforms', 'pressure-belts',
  'atom', 'states', 'wave', 'cell', 'earth-interior', 'eco-pyramid'];
const SIDS = Object.keys(OUTLINE);
const EVENT_S = SIDS.concat('japan');

const args = process.argv.slice(2);
const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith('.js') && f !== '_registry.js')
  .filter((f) => !args.length || args.some((a) => f === a || f === a + '.js' || f.startsWith(a + '-')))
  .sort();

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where, msg) => warns.push(`△ ${where}: ${msg}`);

const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dataDir, '_registry.js'), 'utf8'), ctx, { filename: '_registry.js' });

for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(path.join(dataDir, f), 'utf8'), ctx, { filename: f });
  } catch (e) {
    err(f, `読み込みに失敗: ${e.message}`);
  }
}
const L = ctx.LEARN;

const linkRe = /\[([^\]]+)\]\((#[^)]+)\)/g;
function checkInline(where, s) {
  if (typeof s !== 'string') return;
  const opens = (s.match(/\[\[/g) || []).length;
  const closes = (s.match(/\]\]/g) || []).length;
  if (opens !== closes) err(where, `[[ と ]] の数が合わない（${opens} / ${closes}）`);
  if (/\[\[[^\]]*(\*\*|\[\[)/.test(s)) err(where, '[[ ]] の中に ** か [[ がある');
  if ((s.match(/\*\*/g) || []).length % 2) err(where, '** が閉じていない');
  if (/<[a-z/][^>]*>/i.test(s)) warn(where, 'HTML タグらしきものがある（そのまま表示される）');
  for (const m of s.matchAll(linkRe)) {
    const parts = m[2].slice(1).split('.');
    if (parts[0] !== 'learn' || !OUTLINE[parts[1]] || (parts[2] && !OUTLINE[parts[1]].includes(parts[2]))) err(where, `リンク先が目次にない: ${m[2]}`);
  }
}

const stats = {};
for (const sid of Object.keys(L.subjects)) {
  const units = L.subjects[sid];
  if (!OUTLINE[sid]) {
    err(sid, '未知の科目 ID');
    continue;
  }
  const st = (stats[sid] = { units: units.length, chars: 0, terms: 0, quiz: 0, marks: 0, aDist: [0, 0, 0, 0] });
  const idx = units.map((u) => OUTLINE[sid].indexOf(u.id));
  units.forEach((u, i) => {
    if (idx[i] < 0) err(sid, `目次にない講 ID: "${u.id}"`);
    else if (i && idx[i] <= idx[i - 1]) err(sid, `講の順序が目次と違う: "${u.id}"`);
  });
  if (!args.length) {
    const missing = OUTLINE[sid].filter((id) => !units.some((u) => u.id === id));
    if (missing.length) warn(sid, `未執筆の講: ${missing.join(', ')}`);
  }
  const termSeen = new Map();
  units.forEach((u, ui) => {
    const w = `${sid}.${u.id || '#' + ui}`;
    for (const k of ['id', 'title', 'lead', 'body']) if (typeof u[k] !== 'string' || !u[k].trim()) err(w, `${k} がない`);
    if (!Array.isArray(u.points) || u.points.length !== 3) err(w, 'points はちょうど 3 つ');
    (u.points || []).forEach((p, i) => checkInline(`${w}.points[${i}]`, p));
    checkInline(`${w}.lead`, u.lead);
    const body = u.body || '';
    const bodyPlain = body.replace(/\s/g, '');
    st.chars += bodyPlain.length;
    st.marks += (body.match(/\[\[/g) || []).length;
    if (bodyPlain.length < 1800) warn(w, `本文が短い（${bodyPlain.length} 字）`);
    const heads = body.split('\n').filter((l) => l.trim().startsWith('## ')).length;
    if (heads < 3) warn(w, `見出しが少ない（${heads}）`);
    body.split('\n').forEach((raw, li) => {
      const l = raw.trim();
      const lw = `${w}.body L${li + 1}`;
      checkInline(lw, l);
      const fig = l.match(/^\{\{(\w+):(.*)\}\}$/);
      if (l.startsWith('{{')) {
        if (!fig) err(lw, '{{ }} の書式が不正');
        else if (fig[1] === 'fig' && !FIGS.includes(fig[2].split('|')[0])) err(lw, `未知の図 ID: ${fig[2].split('|')[0]}`);
        else if (!['fig', 'steps'].includes(fig[1])) err(lw, `未知のブロック: ${fig[1]}`);
      }
      if (/^#(?!#)/.test(l) || /^#{4,}/.test(l)) warn(lw, '見出しは ## か ### のみ');
    });
    if (!Array.isArray(u.terms) || u.terms.length < 6) err(w, `terms が少ない（${(u.terms || []).length}）`);
    (u.terms || []).forEach((t, i) => {
      const tw = `${w}.terms[${i}]`;
      if (!Array.isArray(t) || t.length !== 2 || typeof t[0] !== 'string' || typeof t[1] !== 'string') return err(tw, '["用語","説明"] の形でない');
      if (termSeen.has(t[0])) warn(tw, `用語「${t[0]}」が ${termSeen.get(t[0])} と重複`);
      termSeen.set(t[0], u.id);
      if (t[1].includes(t[0])) warn(tw, `説明に用語「${t[0]}」自体が含まれている`);
      if (/\[\[|\*\*/.test(t[0] + t[1])) err(tw, '用語・説明に書式記号は使わない');
      st.terms++;
    });
    if (!Array.isArray(u.quiz) || u.quiz.length < 4) err(w, `quiz が少ない（${(u.quiz || []).length}）`);
    (u.quiz || []).forEach((q, i) => {
      const qw = `${w}.quiz[${i}]`;
      if (typeof q.q !== 'string' || !q.q) err(qw, 'q がない');
      if (!Array.isArray(q.c) || q.c.length !== 4) err(qw, 'c は 4 つ');
      else if (new Set(q.c).size !== 4) err(qw, '選択肢が重複');
      if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) err(qw, 'a は 0〜3');
      else st.aDist[q.a]++;
      if (typeof q.e !== 'string' || !q.e) warn(qw, '解説 e がない');
      if (/\[\[/.test(q.q || '')) warn(qw, '問題文に [[ ]] がある');
      [q.q, q.e, ...(q.c || [])].forEach((s) => checkInline(qw, s));
      st.quiz++;
    });
  });
}

if (L.timeline.length) {
  L.timeline.forEach((e, i) => {
    const w = `timeline[${i}] ${e.t || ''}`;
    if (typeof e.y !== 'number' || Number.isNaN(e.y)) err(w, 'y は数値');
    if (typeof e.t !== 'string' || !e.t) err(w, 't がない');
    if (!EVENT_S.includes(e.s)) err(w, `s が不正: ${e.s}`);
    if (/\[\[/.test((e.t || '') + (e.d || ''))) err(w, '年表では [[ ]] を使わない');
    if (e.y < 0 && e.l && !e.l.startsWith('前')) warn(w, '紀元前なのにラベルが「前」で始まらない');
  });
  const byS = {};
  L.timeline.forEach((e) => (byS[e.s] = (byS[e.s] || 0) + 1));
  stats.timeline = { events: L.timeline.length, ...byS };
}
if (L.people.length) {
  const seen = new Set();
  L.people.forEach((p, i) => {
    const w = `people[${i}] ${p.n || ''}`;
    if (!p.n || !p.k) err(w, 'n と k は必須');
    if (!SIDS.includes(p.s)) err(w, `s が不正: ${p.s}`);
    if (seen.has(p.n)) err(w, '名前が重複');
    seen.add(p.n);
    checkInline(w, p.k);
    checkInline(w, p.d || '');
  });
  const byS = {};
  L.people.forEach((p) => (byS[p.s] = (byS[p.s] || 0) + 1));
  stats.people = { people: L.people.length, ...byS };
}
const figIds = Object.keys(L.diagrams);
if (figIds.length) {
  FIGS.forEach((id) => {
    if (!figIds.includes(id)) warn('diagrams', `図 ${id} が未定義`);
  });
  stats.diagrams = { count: figIds.length };
}

console.log('== 集計 ==');
for (const [k, v] of Object.entries(stats)) console.log(k.padEnd(10), JSON.stringify(v));
if (warns.length) {
  console.log(`\n== 注意 ${warns.length} 件 ==`);
  warns.slice(0, 200).forEach((w) => console.log(w));
}
if (errors.length) {
  console.log(`\n== エラー ${errors.length} 件 ==`);
  errors.slice(0, 200).forEach((e) => console.log(e));
  process.exit(1);
}
console.log('\nOK');
