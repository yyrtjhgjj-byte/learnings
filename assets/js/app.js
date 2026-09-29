/*
 * おとなの社会科 — アプリ本体
 * ハッシュでページを切り替える 1 ファイル構成の SPA。
 * ルートは「.」区切り（例: #learn.politics.constitution）。
 */
(() => {
  'use strict';

  const L = window.LEARN;
  const META = L.meta;
  const SUBJECTS = L.order.filter((id) => Array.isArray(L.subjects[id]));
  const sname = (id) => (META[id] ? META[id].name : id === 'japan' ? '日本' : id);

  /* =========================================================
     小物
     ========================================================= */
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const norm = (s) => String(s || '').normalize('NFKC').toLowerCase();
  const yearLabel = (y) => (y < 0 ? `前${-y}` : String(y));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  const hid = (str) => hash(str).toString(36);

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* アイコン（24px, stroke） */
  const IC = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11.5h13V9"/><path d="M10 20.5v-6h4v6"/>',
    learn: '<path d="M12 6.5C10 5 7 4.5 3.5 5v14c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5z"/><path d="M12 6.5v14"/>',
    practice: '<path d="M4 20h4.5L19.5 9 15 4.5 4 15.5z"/><path d="m13 6.5 4.5 4.5"/>',
    timeline: '<path d="M7 3v18"/><circle cx="7" cy="7" r="2.2"/><circle cx="7" cy="16" r="2.2"/><path d="M11.5 7H20M11.5 16H18"/>',
    dict: '<path d="M6 3.5h12.5v17H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/><path d="M4 16.5a2 2 0 0 1 2-2h12.5"/><path d="M9 8h6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    quiz: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.4v.7"/><path d="M12 16.8v.2"/>',
    cards: '<rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M7.5 4h11a2 2 0 0 1 2 2v11"/>',
    order: '<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>',
    people: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    record: '<path d="M4 20V11M10 20V5M16 20v-6M3 20.5h18"/>',
    point: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v.5h6V15c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3z"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.2"/>',
    trivia: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.2"/>',
    news: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M7 9h10M7 12.5h10M7 16h6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11m0-11-11 11"/>',
    redo: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
    flip: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>'
  };
  const icon = (n) =>
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

  /* =========================================================
     保存データ（localStorage。使えない環境でも落ちない）
     ========================================================= */
  const STORE_KEY = 'otona-shakai:v1';
  const DEFAULTS = () => ({ read: {}, q: {}, cards: {}, days: [], last: null, sheet: false, theme: 'system', size: 'm', reverse: false });
  let S = DEFAULTS();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') S = Object.assign(DEFAULTS(), d);
      }
    } catch (e) {
      /* 保存領域が使えない場合は既定値のまま動く */
    }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(S));
    } catch (e) {
      /* noop */
    }
  }
  function touchDay() {
    const k = dayKey();
    if (!S.days.includes(k)) {
      S.days.push(k);
      if (S.days.length > 400) S.days = S.days.slice(-400);
    }
  }
  function streak() {
    const set = new Set(S.days);
    const d = new Date();
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* =========================================================
     コンテンツ索引
     ========================================================= */
  const UNITS = [];
  const UNIT = {};
  const TERMS = [];
  const TERMS_BY_SID = {};
  const QS = [];
  const QMAP = {};

  SUBJECTS.forEach((sid) => {
    TERMS_BY_SID[sid] = [];
    const seen = new Set();
    L.subjects[sid].forEach((u, i) => {
      const key = `${sid}.${u.id}`;
      const unit = Object.assign({}, u, { sid, key, no: i + 1 });
      UNITS.push(unit);
      UNIT[key] = unit;
      unit.termItems = [];
      (u.terms || []).forEach(([term, def]) => {
        const t = { sid, uid: u.id, unit, term, def, key: `${sid}:${term}` };
        unit.termItems.push(t);
        if (seen.has(term)) return;
        seen.add(term);
        TERMS.push(t);
        TERMS_BY_SID[sid].push(t);
      });
      unit.qItems = [];
      (u.quiz || []).forEach((q) => {
        const item = { id: `${key}.${hid(q.q)}`, kind: 'u', sid, unit, q: q.q, c: q.c, a: q.a, e: q.e };
        unit.qItems.push(item);
        QS.push(item);
        QMAP[item.id] = item;
      });
    });
  });
  const unitsOf = (sid) => UNITS.filter((u) => u.sid === sid);
  const TERM_BY_KEY = {};
  TERMS.forEach((t) => (TERM_BY_KEY[t.key] = t));
  const PERSON_BY_KEY = {};
  L.people.forEach((p) => (PERSON_BY_KEY['p:' + p.n] = p));

  /* 用語から自動で 4 択を作る */
  function termQuestion(t, rand = Math.random) {
    const pool = TERMS_BY_SID[t.sid].filter((x) => x.term !== t.term && !t.def.includes(x.term));
    const same = shuffle(pool.filter((x) => x.uid === t.uid), rand);
    const other = shuffle(pool.filter((x) => x.uid !== t.uid), rand);
    const ds = same.slice(0, 2).concat(other, same.slice(2)).slice(0, 3);
    const masked = t.def.split(t.term).join('〇〇');
    return {
      id: 'k:' + t.key,
      kind: 't',
      sid: t.sid,
      unit: t.unit,
      prompt: '次の説明にあてはまる語句は？',
      q: masked,
      c: [t.term].concat(ds.map((x) => x.term)),
      a: 0,
      e: `**${t.term}**：${t.def}`
    };
  }
  function questionById(id) {
    if (QMAP[id]) return QMAP[id];
    if (id.startsWith('k:') && TERM_BY_KEY[id.slice(2)]) return termQuestion(TERM_BY_KEY[id.slice(2)]);
    return null;
  }

  /* =========================================================
     簡易マークアップ
       ## 見出し / ### 小見出し
       - 箇条書き / 1. 番号
       | 表 | …（1 行目が見出し）
       > ポイント / !> 注意 / ?> 豆知識 / n> ニュースで見る
       {{fig:図ID|キャプション}} / {{steps:A|B|C}}
       インライン: [[重要語]] **強調** {漢字|ふりがな} [文字](#route)
     ========================================================= */
  function inline(s) {
    let h = esc(s);
    h = h.replace(/\[\[(.+?)\]\]/g, '<span class="k">$1</span>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
    h = h.replace(/\[([^\][]+)\]\((#[\w.\-]+)\)/g, '<a href="$2">$1</a>');
    return h;
  }
  const CALLOUT = {
    '>': ['point', 'ポイント', 'point'],
    '!>': ['warn', 'ここで間違えやすい', 'warn'],
    '?>': ['trivia', '豆知識', 'trivia'],
    'n>': ['news', 'ニュースで見るとき', 'news']
  };
  function renderMarkup(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n').map((l) => l.trim());
    const out = [];
    const secs = [];
    let i = 0;
    const isBlockStart = (l) => /^(#{2,3} |- |\d+\. |\||\{\{|[!?n]?> ?)/.test(l);
    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        const id = 'sec-' + secs.length;
        secs.push({ id, t: line.slice(3) });
        out.push(`<h3 id="${id}">${inline(line.slice(3))}</h3>`);
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        out.push(`<h4>${inline(line.slice(4))}</h4>`);
        i++;
        continue;
      }
      const blk = line.match(/^\{\{(\w+):(.*)\}\}$/);
      if (blk) {
        const [name, arg] = [blk[1], blk[2]];
        if (name === 'fig') {
          const [id, cap] = arg.split('|');
          const svg = L.diagrams[id];
          if (svg) out.push(`<figure class="figure">${svg}${cap ? `<figcaption>${inline(cap)}</figcaption>` : ''}</figure>`);
        } else if (name === 'steps') {
          const items = arg.split('|');
          out.push(
            `<div class="steps">${items.map((s, k) => `<div class="step"><b>STEP ${k + 1}</b>${inline(s)}</div>`).join('')}</div>`
          );
        }
        i++;
        continue;
      }
      const co = line.match(/^([!?n]?>) ?(.*)$/);
      if (co && CALLOUT[co[1]]) {
        const prefix = co[1];
        const buf = [];
        while (i < lines.length) {
          const m = lines[i].match(/^([!?n]?>) ?(.*)$/);
          if (!m || m[1] !== prefix) break;
          buf.push(inline(m[2]));
          i++;
        }
        const [cls, label, ic] = CALLOUT[prefix];
        out.push(`<div class="callout ${cls}"><div class="callout-label">${icon(ic)}${label}</div><div>${buf.join('<br>')}</div></div>`);
        continue;
      }
      if (line.startsWith('- ')) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('- ')) buf.push(`<li>${inline(lines[i++].slice(2))}</li>`);
        out.push(`<ul>${buf.join('')}</ul>`);
        continue;
      }
      if (/^\d+\. /.test(line)) {
        const buf = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\d+\. /, ''))}</li>`);
        out.push(`<ol>${buf.join('')}</ol>`);
        continue;
      }
      if (line.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          const l = lines[i++];
          if (/^\|[\s\-:|]+\|$/.test(l)) continue;
          rows.push(l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        }
        const [head, ...body] = rows;
        out.push(
          `<div class="tablewrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table></div>`
        );
        continue;
      }
      const buf = [];
      while (i < lines.length && lines[i] && !(buf.length && isBlockStart(lines[i]))) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(''))}</p>`);
    }
    return { html: out.join('\n'), secs };
  }
  const plain = (s) =>
    String(s || '')
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/\{([^{}|]+)\|[^{}|]+\}/g, '$1')
      .replace(/\[\[|\]\]|\*\*|^#+ |^[!?n]?> ?|^- /gm, '')
      .replace(/\[([^\]]+)\]\(#[^)]+\)/g, '$1')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ');

  /* =========================================================
     統計
     ========================================================= */
  function accuracyOf(filter) {
    let n = 0;
    let c = 0;
    Object.keys(S.q).forEach((id) => {
      if (filter && !filter(id)) return;
      n += S.q[id].n || 0;
      c += S.q[id].c || 0;
    });
    return { n, c, p: n ? Math.round((c / n) * 100) : null };
  }
  const sidOfQ = (id) => (id.startsWith('k:') ? id.slice(2).split(':')[0] : id.split('.')[0]);
  function recordAnswer(id, ok) {
    const s = S.q[id] || { n: 0, c: 0 };
    s.n++;
    if (ok) s.c++;
    s.l = ok ? 1 : 0;
    s.t = Date.now();
    S.q[id] = s;
    touchDay();
    save();
  }
  function weakIds(sids) {
    return Object.keys(S.q)
      .filter((id) => S.q[id].l === 0 && questionById(id) && (!sids || sids.includes(sidOfQ(id))))
      .sort((a, b) => S.q[a].c / S.q[a].n - S.q[b].c / S.q[b].n);
  }

  /* 暗記カード：ライトナー方式（箱 0〜5） */
  const BOX_DAYS = [0, 1, 3, 7, 16, 35];
  const DAY = 86400000;
  function cardState(key) {
    return S.cards[key] || null;
  }
  function gradeCard(key, ok) {
    const st = S.cards[key] || { b: 0, d: 0 };
    st.b = ok ? Math.min(st.b + 1, 5) : 0;
    st.d = Date.now() + (ok ? BOX_DAYS[st.b] * DAY - 3600000 : 0);
    S.cards[key] = st;
    touchDay();
    save();
  }
  function dueKeys(prefixFilter) {
    const now = Date.now();
    return Object.keys(S.cards).filter((k) => S.cards[k].d <= now && (!prefixFilter || prefixFilter(k)));
  }
  const cardSid = (key) => (key.startsWith('p:') ? (PERSON_BY_KEY[key] || {}).s : key.split(':')[0]);

  /* =========================================================
     画面の骨組み
     ========================================================= */
  const view = document.getElementById('view');
  const fab = document.getElementById('sheetFab');
  const toastEl = document.getElementById('toast');
  let keyHandler = null;
  let toastTimer = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  const NAV = [
    { r: 'home', label: 'ホーム', ic: 'home' },
    { r: 'learn', label: '学ぶ', ic: 'learn' },
    { r: 'practice', label: '演習', ic: 'practice' },
    { r: 'timeline', label: '年表', ic: 'timeline' },
    { r: 'dict', label: '辞典', ic: 'dict' }
  ];
  const NAV_GROUP = { quiz: 'practice', cards: 'practice', order: 'practice', record: 'practice', digest: 'learn' };

  function buildChrome() {
    document.getElementById('topbar').innerHTML = `
      <a class="brand" href="#home"><span class="brand-mark">おとなの社会科</span><span class="brand-sub">高校社会の基礎</span></a>
      <a class="iconbtn" href="#search" aria-label="検索">${icon('search')}</a>
      <a class="iconbtn settings-btn" href="#settings" aria-label="設定">${icon('settings')}</a>`;
    document.getElementById('tabbar').innerHTML = NAV.map(
      (n) => `<a class="tab" href="#${n.r}" data-r="${n.r}">${icon(n.ic)}<span>${n.label}</span></a>`
    ).join('');
    document.getElementById('rail').innerHTML = `
      <a class="brand" href="#home"><span class="brand-mark">おとなの社会科</span><span class="brand-sub">高校社会の基礎</span></a>
      ${NAV.map((n) => `<a class="rail-link" href="#${n.r}" data-r="${n.r}">${icon(n.ic)}<span>${n.label}</span></a>`).join('')}
      <a class="rail-link" href="#search" data-r="search">${icon('search')}<span>検索</span></a>
      <div class="rail-sep"></div>
      ${SUBJECTS.map(
        (sid) =>
          `<a class="rail-subject" href="#learn.${sid}" data-s="${sid}"><span class="idx">${META[sid].tag}</span>${META[sid].name}</a>`
      ).join('')}
      <div class="rail-sep"></div>
      <a class="rail-link" href="#settings" data-r="settings">${icon('settings')}<span>設定</span></a>
      <div class="rail-foot">全${UNITS.length}講・用語${TERMS.length}語・人物${L.people.length}人</div>`;
  }
  function setNav(r) {
    const g = NAV_GROUP[r] || r;
    document.querySelectorAll('.tab, .rail-link').forEach((a) => {
      if (a.dataset.r === g) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* 赤シート */
  function setSheetAvailable(on) {
    fab.hidden = !on;
    document.body.classList.toggle('sheet-on', !!(on && S.sheet));
    fab.setAttribute('aria-pressed', S.sheet ? 'true' : 'false');
  }
  fab.addEventListener('click', () => {
    S.sheet = !S.sheet;
    save();
    document.querySelectorAll('.k.open').forEach((k) => k.classList.remove('open'));
    setSheetAvailable(true);
    toast(S.sheet ? '赤シートをのせました。語句をタップでめくれます' : '赤シートを外しました');
  });
  document.addEventListener('click', (e) => {
    const k = e.target.closest('.k');
    if (k && document.body.classList.contains('sheet-on')) k.classList.toggle('open');
  });

  /* テーマ */
  function applyTheme() {
    const root = document.documentElement;
    if (S.theme === 'light' || S.theme === 'dark') {
      root.setAttribute('data-theme', S.theme);
      root.dataset.themeByApp = '1';
    } else if (root.dataset.themeByApp) {
      /* 自分で付けた指定だけ外す（埋め込み先が付けたテーマ指定は尊重する） */
      root.removeAttribute('data-theme');
      delete root.dataset.themeByApp;
    }
    if (S.size === 'm') root.removeAttribute('data-size');
    else root.setAttribute('data-size', S.size);
  }

  window.addEventListener(
    'scroll',
    () => {
      const bar = document.getElementById('readbar');
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
    },
    { passive: true }
  );

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (keyHandler) keyHandler(e);
  });

  /* =========================================================
     ルーター
     ========================================================= */
  function route() {
    const parts = decodeURIComponent(location.hash.replace(/^#/, '')).split('.').filter(Boolean);
    const [r = 'home', a, b] = parts;
    keyHandler = null;
    setSheetAvailable(false);
    let title = '';
    switch (r) {
      case 'learn':
        if (a && b && UNIT[`${a}.${b}`]) title = viewLesson(UNIT[`${a}.${b}`]);
        else if (a && META[a] && L.subjects[a]) title = viewSubject(a);
        else title = viewLearn();
        break;
      case 'digest':
        title = viewDigest(a);
        break;
      case 'practice':
        title = viewPractice();
        break;
      case 'quiz':
        title = viewQuiz(a, b);
        break;
      case 'cards':
        title = viewCards(a);
        break;
      case 'order':
        title = viewOrder();
        break;
      case 'record':
        title = viewRecord();
        break;
      case 'timeline':
        title = viewTimeline();
        break;
      case 'dict':
        title = viewDict(a);
        break;
      case 'search':
        title = viewSearch();
        break;
      case 'settings':
        title = viewSettings();
        break;
      default:
        title = viewHome();
    }
    setNav(r);
    document.title = title ? `${title} | おとなの社会科` : 'おとなの社会科';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* =========================================================
     共通コンポーネント
     ========================================================= */
  function tileHTML(sid) {
    const m = META[sid];
    const us = unitsOf(sid);
    const done = us.filter((u) => S.read[u.key]).length;
    return `<a class="tile" data-s="${sid}" href="#learn.${sid}">
      <span class="tile-tab" aria-hidden="true">${m.tag}</span>
      <span class="tile-name">${m.name}<small>${m.en}</small></span>
      <span class="tile-desc">${m.desc}</span>
      <span class="tile-foot"><span class="bar"><i style="width:${pct(done, us.length)}%"></i></span><span class="num">${done}/${us.length}講</span></span>
    </a>`;
  }

  function unitAcc(u) {
    let n = 0;
    let c = 0;
    u.qItems.forEach((q) => {
      const s = S.q[q.id];
      if (s) {
        n++;
        if (s.l) c++;
      }
    });
    return { n, c };
  }

  /* 4 択 1 問ぶんの DOM を作る */
  function makeQuestion(q, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'card qcard';
    wrap.dataset.s = q.sid;
    const order = shuffle(q.c.map((_, i) => i));
    const where = q.unit ? `${sname(q.sid)} ・ ${q.unit.title}` : sname(q.sid);
    wrap.innerHTML = `
      <div class="qhead"><span class="tag">${esc(where)}</span>${opts.label ? `<span class="num">${esc(opts.label)}</span>` : ''}</div>
      ${q.prompt ? `<p class="hint">${esc(q.prompt)}</p>` : ''}
      <p class="qtext">${q.kind === 't' ? '「' + inline(q.q) + '」' : inline(q.q)}</p>
      <div class="choices">${order
        .map(
          (ci, k) =>
            `<button type="button" class="choice" data-ci="${ci}"><span class="ck">${k + 1}</span><span>${inline(q.c[ci])}</span><span class="mark"></span></button>`
        )
        .join('')}</div>
      <div class="explain" hidden></div>`;
    let answered = false;
    function answer(ci) {
      if (answered) return;
      answered = true;
      const ok = ci === q.a;
      wrap.querySelectorAll('.choice').forEach((b) => {
        const c = +b.dataset.ci;
        b.disabled = true;
        if (c === q.a) {
          b.classList.add('correct');
          b.querySelector('.mark').textContent = '正解';
        } else if (c === ci) {
          b.classList.add('wrong');
          b.querySelector('.mark').textContent = 'あなたの答え';
        } else b.classList.add('dim');
      });
      const ex = wrap.querySelector('.explain');
      ex.hidden = false;
      ex.innerHTML = `<div class="verdict ${ok ? 'ok' : 'ng'}">${icon(ok ? 'check' : 'x')}${ok ? '正解' : '不正解'}</div>
        ${q.e ? `<div>${inline(q.e)}</div>` : ''}
        ${opts.link !== false && q.unit ? `<a href="#learn.${q.unit.key}">第${q.unit.no}講「${esc(q.unit.title)}」を読む</a>` : ''}`;
      recordAnswer(q.id, ok);
      if (opts.onAnswer) opts.onAnswer(ok);
    }
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('.choice');
      if (b) answer(+b.dataset.ci);
    });
    wrap.answerAt = (k) => {
      if (order[k] != null) answer(order[k]);
    };
    wrap.isAnswered = () => answered;
    return wrap;
  }

  function subjectChips(selected, { all = true, multi = true, name = 'sub' } = {}) {
    const items = SUBJECTS.map(
      (sid) =>
        `<button type="button" class="chip" data-s="${sid}" data-v="${sid}" aria-pressed="${selected.includes(sid)}"><span class="dot"></span>${META[sid].name}</button>`
    );
    if (all && !multi) items.unshift(`<button type="button" class="chip" data-v="" aria-pressed="${!selected.length}">すべて</button>`);
    return `<div class="chips" data-chips="${name}" data-multi="${multi}">${items.join('')}</div>`;
  }
  function bindChips(root, name, onChange) {
    const box = root.querySelector(`[data-chips="${name}"]`);
    if (!box) return;
    const multi = box.dataset.multi === 'true';
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      if (multi) {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      } else {
        box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b ? 'true' : 'false'));
      }
      onChange(chipValues(box));
    });
  }
  const chipValues = (box) =>
    Array.from(box.querySelectorAll('.chip[aria-pressed="true"]'))
      .map((c) => c.dataset.v)
      .filter(Boolean);

  function segHTML(name, options, value) {
    return `<div class="seg" role="tablist" data-seg="${name}">${options
      .map(([v, label]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === value}">${label}</button>`)
      .join('')}</div>`;
  }
  function bindSeg(root, name, onChange) {
    const box = root.querySelector(`[data-seg="${name}"]`);
    if (!box) return;
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
      onChange(b.dataset.v);
    });
  }

  function personHTML(p) {
    return `<article class="card person" data-s="${p.s}">
      <div class="person-head"><span class="person-name">${esc(p.n)}</span><span class="person-years">${esc(p.y || '')}</span></div>
      <div class="person-key">${inline(p.k)}</div>
      ${p.d ? `<p class="person-desc">${inline(p.d)}</p>` : ''}
      <div class="person-foot"><span class="tag">${sname(p.s)}</span>${p.w ? `<span class="hint">主著・代表作：${esc(p.w)}</span>` : ''}</div>
    </article>`;
  }

  /* =========================================================
     ホーム
     ========================================================= */
  function viewHome() {
    const now = new Date();
    const wd = '日月火水木金土'[now.getDay()];
    const total = UNITS.length;
    const done = UNITS.filter((u) => S.read[u.key]).length;
    const acc = accuracyOf();
    /* 続きから：最後に開いた講。読了済みなら同じ科目の次の講、まだ何も開いていなければ最初の講 */
    let last = S.last && UNIT[S.last];
    let lastLabel = '続きから';
    if (last && S.read[last.key]) {
      const nx = unitsOf(last.sid)[last.no] || UNITS.find((u) => !S.read[u.key]);
      if (nx) {
        last = nx;
        lastLabel = '次に読む';
      }
    } else if (!last && UNITS.length) {
      last = UNITS[0];
      lastLabel = 'まずはここから';
    }
    const r = rng(hash(dayKey()));
    const dq = QS[Math.floor(r() * QS.length)];
    const person = L.people.length ? L.people[Math.floor(r() * L.people.length)] : null;
    const due = dueKeys().length;
    const weak = weakIds().length;
    const st = streak();

    view.innerHTML = `<div class="page">
      <section class="hero">
        <p class="hero-date num">${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${wd}）</p>
        <h1 class="hero-title">知っておくべき<br><span class="k">社会</span>を、ひととおり。</h1>
        <p class="hero-lead">政治・経済・倫理・地理・世界史。高校で習うはずの基礎を全${total}講にまとめたノートです。オレンジの語句は、赤シートで隠して覚えられます。</p>
        <div class="stats">
          <div class="stat"><b>${st}<small>日</small></b><span>連続学習</span></div>
          <div class="stat"><b>${done}<small>/${total}</small></b><span>読了した講</span></div>
          <div class="stat"><b>${acc.p == null ? '—' : acc.p}<small>${acc.p == null ? '' : '%'}</small></b><span>正答率</span></div>
        </div>
      </section>

      ${
        last
          ? `<section class="section">
        <div class="section-head"><h2 class="section-title">${lastLabel}</h2></div>
        <a class="card continue" data-s="${last.sid}" href="#learn.${last.key}">
          <span class="idx">${META[last.sid].tag}</span>
          <span class="continue-body"><span class="continue-title">${esc(last.title)}</span><span class="continue-sub">${sname(last.sid)} 第${last.no}講</span></span>
          ${icon('chevron')}
        </a>
      </section>`
          : ''
      }

      <section class="section">
        <div class="section-head"><h2 class="section-title">今日の一問</h2><a class="section-link" href="#quiz">もっと解く →</a></div>
        <div id="dailyQ"></div>
      </section>

      <section class="section">
        <div class="section-head"><h2 class="section-title">科目</h2><a class="section-link" href="#learn">全講の目次 →</a></div>
        <div class="tiles">${SUBJECTS.map(tileHTML).join('')}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2 class="section-title">復習</h2><a class="section-link" href="#record">学習記録 →</a></div>
        <div class="duo">
          <div class="card mini">
            <h3>${icon('cards')}暗記カード</h3>
            <p>${due ? `今日めくるカードが <b class="num">${due}</b> 枚あります。` : 'いま復習待ちのカードはありません。新しい用語から始めましょう。'}</p>
            <div class="btn-row"><a class="btn btn-sm btn-primary" href="#cards">カードをめくる</a></div>
          </div>
          <div class="card mini">
            <h3>${icon('quiz')}苦手な問題</h3>
            <p>${weak ? `直近で間違えた問題が <b class="num">${weak}</b> 問あります。` : '間違えた問題はまだありません。'}</p>
            <div class="btn-row"><a class="btn btn-sm${weak ? ' btn-primary' : ''}" href="${weak ? '#quiz.weak' : '#quiz'}">${weak ? '解き直す' : 'クイズへ'}</a></div>
          </div>
        </div>
      </section>

      ${
        person
          ? `<section class="section">
        <div class="section-head"><h2 class="section-title">今日の人物</h2><a class="section-link" href="#dict.people">人物一覧 →</a></div>
        ${personHTML(person)}
      </section>`
          : ''
      }
    </div>`;
    if (dq) view.querySelector('#dailyQ').appendChild(makeQuestion(dq));
    return '';
  }

  /* =========================================================
     学ぶ（全体目次）
     ========================================================= */
  function viewLearn() {
    view.innerHTML = `<div class="page">
      <header class="lesson-head">
        <p class="eyebrow">CONTENTS</p>
        <h1 class="lesson-title">学ぶ</h1>
        <p class="lesson-lead">5 科目・全${UNITS.length}講。どこから読んでも大丈夫なように、1 講ずつ完結させています。</p>
      </header>
      <div class="tiles">${SUBJECTS.map(tileHTML).join('')}</div>
      <a class="card continue" href="#digest">
        <span class="mode-icon">${icon('point')}</span>
        <span class="continue-body"><span class="continue-title">要点総ざらい</span><span class="continue-sub">全${UNITS.length}講の「要点 3 つ」だけを一気に読む。赤シート対応</span></span>
        ${icon('chevron')}
      </a>
      ${SUBJECTS.map(
        (sid) => `<section class="section" data-s="${sid}">
          <div class="section-head"><h2 class="section-title"><span class="idx">${META[sid].tag}</span>${META[sid].name}</h2><a class="section-link" href="#learn.${sid}">科目ページ →</a></div>
          <div class="units">${unitsOf(sid).map(unitRowHTML).join('')}</div>
        </section>`
      ).join('')}
    </div>`;
    return '学ぶ';
  }

  function unitRowHTML(u) {
    const a = unitAcc(u);
    return `<a class="unit-row" data-s="${u.sid}" href="#learn.${u.key}">
      <span class="unit-no">第${u.no}講</span>
      <span class="unit-title">${esc(u.title)}</span>
      <span class="unit-status">${S.read[u.key] ? '<span class="pill ok">読了</span>' : ''}${
        a.n ? `<span class="pill${a.c === a.n ? ' ok' : ''} num">${a.c}/${u.qItems.length}</span>` : ''
      }</span>
      <span class="unit-lead">${esc(u.lead)}</span>
    </a>`;
  }

  /* =========================================================
     科目ページ
     ========================================================= */
  function viewSubject(sid) {
    const m = META[sid];
    const us = unitsOf(sid);
    const done = us.filter((u) => S.read[u.key]).length;
    const acc = accuracyOf((id) => sidOfQ(id) === sid);
    view.innerHTML = `<div class="page" data-s="${sid}">
      <nav class="crumbs"><a href="#learn">学ぶ</a><span aria-hidden="true">›</span><span>${m.name}</span></nav>
      <header class="subject-head" data-tag="${m.tag}">
        <p class="eyebrow">${m.en.toUpperCase()}</p>
        <h1>${m.name}</h1>
        <p>${m.desc}</p>
        <div class="subject-meta"><span class="bar"><i style="width:${pct(done, us.length)}%"></i></span><span class="num">読了 ${done}/${us.length}</span>${
          acc.p != null ? `<span class="num">正答率 ${acc.p}%</span>` : ''
        }</div>
        <div class="btn-row">
          <a class="btn btn-subject" href="#learn.${us[0].key}">第1講から読む</a>
          <a class="btn" href="#quiz.${sid}">${icon('quiz')}クイズ</a>
          <a class="btn" href="#cards.${sid}">${icon('cards')}カード</a>
        </div>
      </header>
      <div class="units">${us.map(unitRowHTML).join('')}</div>
    </div>`;
    return m.name;
  }

  /* =========================================================
     講（レッスン）
     ========================================================= */
  function viewLesson(u) {
    const m = META[u.sid];
    const us = unitsOf(u.sid);
    const prev = us[u.no - 2];
    const next = us[u.no];
    const { html, secs } = renderMarkup(u.body);
    S.last = u.key;
    save();

    view.innerHTML = `<div class="readbar" data-s="${u.sid}" aria-hidden="true"><i id="readbar"></i></div>
    <div class="page" data-s="${u.sid}">
      <nav class="crumbs"><a href="#learn">学ぶ</a><span aria-hidden="true">›</span><a href="#learn.${u.sid}">${m.name}</a><span aria-hidden="true">›</span><span>第${u.no}講</span></nav>
      <header class="lesson-head">
        <p class="lesson-no"><span class="idx">${m.tag}</span>${m.name} 第${u.no}講</p>
        <h1 class="lesson-title">${esc(u.title)}</h1>
        <p class="lesson-lead">${inline(u.lead)}</p>
      </header>

      ${
        u.points && u.points.length
          ? `<section class="points"><h2>この講の要点</h2><ol>${u.points.map((p) => `<li><span>${inline(p)}</span></li>`).join('')}</ol></section>`
          : ''
      }

      ${secs.length > 2 ? `<nav class="toc" aria-label="この講の目次">${secs.map((s) => `<button type="button" data-jump="${s.id}">${inline(s.t)}</button>`).join('')}</nav>` : ''}

      <article class="prose">${html}</article>

      ${
        u.termItems.length
          ? `<section class="section">
        <div class="section-head"><h2 class="section-title">重要用語 <span class="pill num">${u.termItems.length}</span></h2><span class="hint">赤シートで用語だけ隠せます</span></div>
        <dl class="terms">${u.termItems.map((t) => `<div class="term"><dt><span class="k">${esc(t.term)}</span></dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl>
      </section>`
          : ''
      }

      ${
        u.qItems.length
          ? `<section class="section">
        <div class="section-head"><h2 class="section-title">確認問題 <span class="pill num">${u.qItems.length}</span></h2><a class="section-link" href="#quiz.${u.key}">用語問題も入れて解く →</a></div>
        <div class="review-list" id="lessonQs"></div>
      </section>`
          : ''
      }

      <div class="card done-box">
        <p id="doneMsg">${S.read[u.key] ? 'この講は読了済みです。' : '読み終えたら記録しておきましょう。'}</p>
        <button type="button" class="btn btn-sm ${S.read[u.key] ? '' : 'btn-subject'}" id="doneBtn">${S.read[u.key] ? '未読に戻す' : '読了にする'}</button>
      </div>

      <nav class="pager">
        ${prev ? `<a class="card" href="#learn.${prev.key}"><small>← 第${prev.no}講</small><span>${esc(prev.title)}</span></a>` : ''}
        ${next ? `<a class="card next" href="#learn.${next.key}"><small>第${next.no}講 →</small><span>${esc(next.title)}</span></a>` : ''}
      </nav>
    </div>`;

    setSheetAvailable(true);

    view.querySelectorAll('[data-jump]').forEach((b) =>
      b.addEventListener('click', () => {
        const el = document.getElementById(b.dataset.jump);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
    );

    const box = view.querySelector('#lessonQs');
    if (box) {
      let answered = 0;
      u.qItems.forEach((q, i) => {
        box.appendChild(
          makeQuestion(q, {
            label: `${i + 1} / ${u.qItems.length}`,
            link: false,
            onAnswer: () => {
              answered++;
              if (answered === u.qItems.length && !S.read[u.key]) {
                markRead(true);
                toast('確認問題を全部解いたので、読了にしました');
              }
            }
          })
        );
      });
    }

    const doneBtn = view.querySelector('#doneBtn');
    function markRead(on) {
      if (on) S.read[u.key] = Date.now();
      else delete S.read[u.key];
      touchDay();
      save();
      doneBtn.textContent = on ? '未読に戻す' : '読了にする';
      doneBtn.classList.toggle('btn-subject', !on);
      view.querySelector('#doneMsg').textContent = on ? 'この講は読了済みです。' : '読み終えたら記録しておきましょう。';
    }
    doneBtn.addEventListener('click', () => {
      const on = !S.read[u.key];
      markRead(on);
      if (on) toast(next ? `読了！次は「${next.title}」` : `${m.name}を最後まで読みました`);
    });
    return u.title;
  }

  /* =========================================================
     要点総ざらい
     ========================================================= */
  function viewDigest(a) {
    const sid = a && META[a] ? a : '';
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#learn">学ぶ</a><span aria-hidden="true">›</span><span>要点総ざらい</span></nav>
      <header class="lesson-head">
        <p class="eyebrow">DIGEST</p>
        <h1 class="lesson-title">要点総ざらい</h1>
        <p class="lesson-lead">各講の「要点 3 つ」だけを並べました。右下の赤シートで重要語を隠し、言えるか試してから講を開くと効率的です。</p>
      </header>
      ${subjectChips(sid ? [sid] : [], { multi: false, name: 'gsub' })}
      <div id="digestBody" style="display:grid;gap:28px"></div>
    </div>`;
    const body = view.querySelector('#digestBody');
    function draw(filter) {
      body.innerHTML = SUBJECTS.filter((x) => !filter || x === filter)
        .map(
          (x) => `<section class="section" data-s="${x}">
          <h2 class="section-title"><span class="idx">${META[x].tag}</span>${META[x].name}</h2>
          ${unitsOf(x)
            .map(
              (u) => `<div class="points">
              <h2><a href="#learn.${u.key}" style="text-decoration:none;color:inherit">第${u.no}講　${esc(u.title)}</a></h2>
              <ol>${(u.points || []).map((p) => `<li><span>${inline(p)}</span></li>`).join('')}</ol>
            </div>`
            )
            .join('')}
        </section>`
        )
        .join('');
    }
    bindChips(view, 'gsub', (v) => draw(v[0] || ''));
    setSheetAvailable(true);
    draw(sid);
    return '要点総ざらい';
  }

  /* =========================================================
     演習ハブ
     ========================================================= */
  function viewPractice() {
    const due = dueKeys().length;
    const weak = weakIds().length;
    const acc = accuracyOf();
    const qTotal = QS.length + TERMS.length;
    view.innerHTML = `<div class="page">
      <header class="lesson-head">
        <p class="eyebrow">PRACTICE</p>
        <h1 class="lesson-title">演習</h1>
        <p class="lesson-lead">読んだら、解く。解いたら、忘れる前にもう一度。答えた結果はこの端末に記録されます。</p>
      </header>
      <div class="practice-grid">
        <a class="card mode" href="#quiz">
          <span class="mode-icon">${icon('quiz')}</span>
          <h3>4択クイズ</h3>
          <p>各講の確認問題と、用語から自動で作る問題。科目・問題数・苦手優先などを選べます。</p>
          <span class="mode-foot num">全${qTotal}問${acc.p != null ? `・これまでの正答率 ${acc.p}%` : ''}</span>
        </a>
        <a class="card mode" href="#cards">
          <span class="mode-icon">${icon('cards')}</span>
          <h3>暗記カード</h3>
          <p>用語をめくって「覚えた／まだ」。覚えたカードは 1日後、3日後、1週間後…と間隔をあけて出てきます。</p>
          <span class="mode-foot num">${TERMS.length}枚${due ? `・今日の復習 ${due}枚` : ''}</span>
        </a>
        <a class="card mode" href="#cards.people">
          <span class="mode-icon">${icon('people')}</span>
          <h3>人物カード</h3>
          <p>ソクラテス、ロック、ケインズ、ナポレオン…名前を見て、何をした人か言えるか。</p>
          <span class="mode-foot num">${L.people.length}人</span>
        </a>
        <a class="card mode" href="#order">
          <span class="mode-icon">${icon('order')}</span>
          <h3>どっちが先？</h3>
          <p>年表から 2 つの出来事を出題。先に起きたほうを選ぶだけ。時代の前後関係がつかめます。</p>
          <span class="mode-foot num">出来事 ${L.timeline.length}件から出題</span>
        </a>
      </div>
      <section class="section">
        <div class="section-head"><h2 class="section-title">すぐ復習</h2></div>
        <div class="btn-row">
          <a class="btn${weak ? ' btn-primary' : ''}" href="${weak ? '#quiz.weak' : '#quiz'}">${icon('redo')}間違えた問題 <span class="num">${weak}</span></a>
          <a class="btn${due ? ' btn-primary' : ''}" href="#cards">${icon('cards')}復習カード <span class="num">${due}</span></a>
          <a class="btn" href="#record">${icon('record')}学習記録</a>
        </div>
      </section>
    </div>`;
    return '演習';
  }

  /* =========================================================
     4択クイズ
     ========================================================= */
  const quizPrefs = { sids: [], src: 'both', pri: 'random', n: 10 };

  function viewQuiz(a, b) {
    if (a === 'weak') {
      const ids = weakIds().slice(0, 20);
      if (!ids.length) {
        toast('間違えた問題はありません');
        return viewQuizSetup();
      }
      return runQuiz(shuffle(ids.map(questionById).filter(Boolean)), '間違えた問題');
    }
    if (a && b && UNIT[`${a}.${b}`]) {
      const u = UNIT[`${a}.${b}`];
      const qs = u.qItems.concat(u.termItems.map((t) => termQuestion(t)));
      return runQuiz(shuffle(qs), `第${u.no}講「${u.title}」`, u);
    }
    if (a && META[a]) quizPrefs.sids = [a];
    return viewQuizSetup();
  }

  function buildQuizPool() {
    const sids = quizPrefs.sids.length ? quizPrefs.sids : SUBJECTS;
    let pool = [];
    if (quizPrefs.src !== 'term') pool = pool.concat(QS.filter((q) => sids.includes(q.sid)));
    if (quizPrefs.src !== 'unit') pool = pool.concat(TERMS.filter((t) => sids.includes(t.sid)).map((t) => ({ lazyTerm: t, id: 'k:' + t.key, sid: t.sid })));
    if (quizPrefs.pri === 'fresh') pool = pool.filter((q) => !S.q[q.id]);
    if (quizPrefs.pri === 'weak') {
      pool = pool.filter((q) => S.q[q.id] && (S.q[q.id].l === 0 || S.q[q.id].c / S.q[q.id].n < 0.7));
      pool = shuffle(pool).sort((x, y) => S.q[x.id].c / S.q[x.id].n - S.q[y.id].c / S.q[y.id].n);
    } else pool = shuffle(pool);
    return pool;
  }

  function viewQuizSetup() {
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><span>4択クイズ</span></nav>
      <header class="lesson-head"><h1 class="lesson-title">4択クイズ</h1></header>
      <div class="card setup">
        <div class="setup-row"><span class="lbl">科目（未選択ならすべて）</span>${subjectChips(quizPrefs.sids)}</div>
        <div class="setup-row"><span class="lbl">出題</span>${segHTML('src', [['both', '両方'], ['unit', '確認問題'], ['term', '用語問題']], quizPrefs.src)}</div>
        <div class="setup-row"><span class="lbl">並び</span>${segHTML('pri', [['random', 'ランダム'], ['fresh', 'まだ解いてない'], ['weak', '苦手優先']], quizPrefs.pri)}</div>
        <div class="setup-row"><span class="lbl">問題数</span>${segHTML('n', [['10', '10問'], ['20', '20問'], ['30', '30問']], String(quizPrefs.n))}</div>
        <p class="hint" id="poolInfo"></p>
        <div class="btn-row"><button type="button" class="btn btn-primary" id="startQuiz">はじめる</button></div>
      </div>
    </div>`;
    const info = view.querySelector('#poolInfo');
    const startBtn = view.querySelector('#startQuiz');
    const update = () => {
      const n = buildQuizPool().length;
      info.textContent = n ? `条件に合う問題：${n}問` : quizPrefs.pri === 'weak' ? '苦手な問題はまだありません。まずはランダムで解いてみましょう。' : '条件に合う問題がありません。';
      startBtn.disabled = !n;
    };
    bindChips(view, 'sub', (v) => {
      quizPrefs.sids = v;
      update();
    });
    bindSeg(view, 'src', (v) => {
      quizPrefs.src = v;
      update();
    });
    bindSeg(view, 'pri', (v) => {
      quizPrefs.pri = v;
      update();
    });
    bindSeg(view, 'n', (v) => {
      quizPrefs.n = +v;
    });
    startBtn.addEventListener('click', () => {
      const pool = buildQuizPool().slice(0, quizPrefs.n).map((q) => (q.lazyTerm ? termQuestion(q.lazyTerm) : q));
      runQuiz(pool, quizPrefs.sids.length ? quizPrefs.sids.map(sname).join('・') : '全科目');
      window.scrollTo(0, 0);
    });
    update();
    return '4択クイズ';
  }

  function runQuiz(questions, label, unit) {
    let idx = 0;
    const results = [];
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><a href="#quiz">4択クイズ</a><span aria-hidden="true">›</span><span>${esc(label)}</span></nav>
      <div class="progress-line"><i id="qProg" style="width:0%"></i></div>
      <div id="qStage"></div>
      <div class="qfoot"><span class="hint kbd-hint">キーボード：1〜4で解答、Enterで次へ</span><button type="button" class="btn btn-primary" id="qNext" hidden>次へ</button></div>
    </div>`;
    const stage = view.querySelector('#qStage');
    const next = view.querySelector('#qNext');
    const prog = view.querySelector('#qProg');
    let cur = null;

    function show() {
      stage.innerHTML = '';
      next.hidden = true;
      prog.style.width = pct(idx, questions.length) + '%';
      const q = questions[idx];
      cur = makeQuestion(q, {
        label: `${idx + 1} / ${questions.length}`,
        onAnswer: (ok) => {
          results.push({ q, ok });
          next.hidden = false;
          next.textContent = idx + 1 < questions.length ? '次へ' : '結果を見る';
          next.focus({ preventScroll: true });
        }
      });
      stage.appendChild(cur);
    }
    function finish() {
      keyHandler = null;
      const ok = results.filter((r) => r.ok).length;
      const p = pct(ok, results.length);
      const msg = p === 100 ? '満点。お見事です。' : p >= 80 ? 'かなり身についています。' : p >= 50 ? 'あと一歩。間違えた所だけ見直しましょう。' : '読み直してから、もう一度。';
      const wrong = results.filter((r) => !r.ok);
      view.querySelector('.qfoot').remove();
      prog.style.width = '100%';
      stage.innerHTML = `<div class="card result">
          <p class="eyebrow">RESULT</p>
          <div class="result-score">${ok}<small> / ${results.length}</small></div>
          <p class="result-msg">${msg}</p>
          <div class="btn-row" style="justify-content:center">
            ${wrong.length ? '<button type="button" class="btn btn-primary" id="retryWrong">間違えた問題だけもう一度</button>' : ''}
            <a class="btn" href="${unit ? '#learn.' + unit.key : '#quiz'}">${unit ? '講に戻る' : '条件を変える'}</a>
            <a class="btn btn-ghost" href="#practice">演習トップ</a>
          </div>
        </div>
        ${
          wrong.length
            ? `<section class="section" style="margin-top:24px"><h2 class="section-title">間違えた問題</h2><div class="review-list">${wrong
                .map(
                  ({ q }) => `<div class="card review-item" data-s="${q.sid}">
              <span class="tag">${esc(sname(q.sid))}${q.unit ? ' ・ ' + esc(q.unit.title) : ''}</span>
              <div class="q">${q.kind === 't' ? '「' + inline(q.q) + '」' : inline(q.q)}</div>
              <div class="a">正解：${inline(q.c[q.a])}</div>
              ${q.e ? `<div class="e">${inline(q.e)}</div>` : ''}
              ${q.unit ? `<a class="section-link" href="#learn.${q.unit.key}">第${q.unit.no}講を読む →</a>` : ''}
            </div>`
                )
                .join('')}</div></section>`
            : ''
        }`;
      const rb = stage.querySelector('#retryWrong');
      if (rb)
        rb.addEventListener('click', () => {
          runQuiz(shuffle(wrong.map((r) => (r.q.kind === 't' ? termQuestion(TERM_BY_KEY[r.q.id.slice(2)]) : r.q))), label + '（復習）', unit);
          window.scrollTo(0, 0);
        });
    }
    next.addEventListener('click', () => {
      idx++;
      if (idx < questions.length) {
        show();
        stage.scrollIntoView({ block: 'nearest' });
      } else finish();
    });
    keyHandler = (e) => {
      if (/^[1-4]$/.test(e.key) && cur && !cur.isAnswered()) cur.answerAt(+e.key - 1);
      else if ((e.key === 'Enter' || e.key === 'ArrowRight') && !next.hidden && document.activeElement !== next) {
        e.preventDefault();
        next.click();
      }
    };
    show();
    return '4択クイズ';
  }

  /* =========================================================
     暗記カード
     ========================================================= */
  const cardPrefs = { sids: [], order: 'due', n: 20 };

  function cardDeck(kind) {
    const sids = cardPrefs.sids.length ? cardPrefs.sids : SUBJECTS;
    let items;
    if (kind === 'people') {
      items = L.people.filter((p) => sids.includes(p.s)).map((p) => ({ key: 'p:' + p.n, sid: p.s, person: p }));
    } else {
      items = TERMS.filter((t) => sids.includes(t.sid)).map((t) => ({ key: t.key, sid: t.sid, term: t }));
    }
    const now = Date.now();
    if (cardPrefs.order === 'random') return { deck: shuffle(items), all: items };
    const due = items.filter((it) => cardState(it.key) && cardState(it.key).d <= now).sort((x, y) => cardState(x.key).d - cardState(y.key).d);
    const fresh = items.filter((it) => !cardState(it.key));
    return { deck: due.concat(kind === 'people' ? shuffle(fresh) : fresh), all: items, due: due.length, fresh: fresh.length };
  }

  function viewCards(a) {
    const kind = a === 'people' ? 'people' : 'terms';
    if (a && META[a]) cardPrefs.sids = [a];
    const title = kind === 'people' ? '人物カード' : '暗記カード';
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><span>${title}</span></nav>
      <header class="lesson-head"><h1 class="lesson-title">${title}</h1>
        <p class="lesson-lead">${kind === 'people' ? '名前を見て、何をした人・何を考えた人か思い浮かべてからめくります。' : '用語を見て、意味を説明できるか。答えを思い浮かべてからめくります。'}</p></header>
      <div class="card setup">
        <div class="setup-row"><span class="lbl">科目（未選択ならすべて）</span>${subjectChips(cardPrefs.sids)}</div>
        <div class="setup-row"><span class="lbl">並び</span>${segHTML('order', [['due', '復習待ち→新しい順'], ['random', 'ランダム']], cardPrefs.order)}</div>
        ${kind === 'terms' ? `<div class="setup-row"><span class="lbl">表にするもの</span>${segHTML('rev', [['0', '用語'], ['1', '説明']], S.reverse ? '1' : '0')}</div>` : ''}
        <div class="setup-row"><span class="lbl">枚数</span>${segHTML('n', [['10', '10枚'], ['20', '20枚'], ['50', '50枚']], String(cardPrefs.n))}</div>
        <div class="setup-row"><span class="lbl">覚え具合（箱の番号が大きいほど定着）</span><div class="boxes" id="boxes"></div></div>
        <div class="btn-row"><button type="button" class="btn btn-primary" id="startCards">めくる</button></div>
      </div>
    </div>`;
    const startBtn = view.querySelector('#startCards');
    const boxesEl = view.querySelector('#boxes');
    const update = () => {
      const { deck, all, due } = cardDeck(kind);
      const counts = [0, 0, 0, 0, 0, 0];
      let fresh = 0;
      all.forEach((it) => {
        const st = cardState(it.key);
        if (st) counts[st.b]++;
        else fresh++;
      });
      boxesEl.innerHTML =
        `<div class="box"><b>${fresh}</b>未学習</div>` +
        counts
          .slice(0, 5)
          .map((c, i) => `<div class="box"><b>${i === 4 ? c + counts[5] : c}</b>${i === 0 ? '箱0' : i === 4 ? '箱4+' : '箱' + i}</div>`)
          .join('');
      startBtn.textContent = due ? `めくる（復習 ${due}枚から）` : 'めくる';
      startBtn.disabled = !deck.length;
    };
    bindChips(view, 'sub', (v) => {
      cardPrefs.sids = v;
      update();
    });
    bindSeg(view, 'order', (v) => {
      cardPrefs.order = v;
      update();
    });
    bindSeg(view, 'rev', (v) => {
      S.reverse = v === '1';
      save();
    });
    bindSeg(view, 'n', (v) => {
      cardPrefs.n = +v;
    });
    startBtn.addEventListener('click', () => {
      runCards(cardDeck(kind).deck.slice(0, cardPrefs.n), kind);
      window.scrollTo(0, 0);
    });
    update();
    return title;
  }

  function runCards(deck, kind) {
    const queue = deck.slice();
    const retried = new Set();
    let known = 0;
    let seen = 0;
    const total = deck.length;
    const title = kind === 'people' ? '人物カード' : '暗記カード';
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><a href="#cards${kind === 'people' ? '.people' : ''}">${title}</a><span aria-hidden="true">›</span><span>めくる</span></nav>
      <div class="progress-line"><i id="cProg" style="width:0%"></i></div>
      <div id="cStage"></div>
    </div>`;
    const stage = view.querySelector('#cStage');
    const prog = view.querySelector('#cProg');

    function faces(it) {
      if (it.person) {
        const p = it.person;
        return {
          front: `<div class="fc-term">${esc(p.n)}</div>`,
          back: `<div class="fc-def"><p class="person-years">${esc(p.y || '')}</p><p><b>${inline(p.k)}</b></p>${p.d ? `<p style="margin-top:.6em;color:var(--ink-2);font-size:.92rem">${inline(p.d)}</p>` : ''}${
            p.w ? `<p class="hint" style="margin-top:.6em">主著・代表作：${esc(p.w)}</p>` : ''
          }</div>`,
          meta: sname(p.s)
        };
      }
      const t = it.term;
      const termHTML = `<div class="fc-term">${esc(t.term)}</div>`;
      const defHTML = `<div class="fc-def">${esc(t.def)}</div>`;
      return {
        front: S.reverse ? defHTML : termHTML,
        back: S.reverse
          ? termHTML + `<div class="fc-def" style="margin-top:.8em;font-size:.9rem;color:var(--ink-2)">${esc(t.def)}</div>`
          : `<div class="fc-def"><p class="fc-backterm">${esc(t.term)}</p>${esc(t.def)}</div>`,
        meta: `${sname(t.sid)} ・ 第${t.unit.no}講 ${t.unit.title}`
      };
    }

    function show() {
      if (!queue.length) return finish();
      const it = queue[0];
      const f = faces(it);
      const st = cardState(it.key);
      prog.style.width = pct(seen, total) + '%';
      stage.innerHTML = `<div class="fc-stage" data-s="${it.sid}">
          <button type="button" class="fc" id="fc" aria-label="カードをめくる">
            <div class="fc-face fc-front"><div class="fc-meta"><span class="tag">${esc(f.meta)}</span><span class="num">${st ? '箱' + st.b : 'NEW'}</span></div><div class="fc-main">${f.front}</div><p class="fc-hint">タップでめくる<span class="kbd-hint">（Space）</span></p></div>
            <div class="fc-face fc-back"><div class="fc-meta"><span class="tag">${esc(f.meta)}</span><span class="num">残り ${queue.length}</span></div><div class="fc-main">${f.back}</div></div>
          </button>
        </div>
        <div class="fc-actions" style="margin-top:14px">
          <button type="button" class="btn btn-ng" id="fcNo">${icon('x')}まだ<span class="kbd-hint">（←）</span></button>
          <button type="button" class="btn btn-ok" id="fcYes">${icon('check')}覚えた<span class="kbd-hint">（→）</span></button>
        </div>`;
      const fc = stage.querySelector('#fc');
      fc.addEventListener('click', () => fc.classList.toggle('flipped'));
      stage.querySelector('#fcNo').addEventListener('click', () => grade(false));
      stage.querySelector('#fcYes').addEventListener('click', () => grade(true));
    }
    function grade(ok) {
      const it = queue.shift();
      gradeCard(it.key, ok);
      if (!retried.has(it.key)) seen++;
      if (ok) known++;
      else if (!retried.has(it.key)) {
        retried.add(it.key);
        queue.push(it);
      }
      show();
    }
    function finish() {
      keyHandler = null;
      prog.style.width = '100%';
      stage.innerHTML = `<div class="card result">
        <p class="eyebrow">DONE</p>
        <div class="result-score">${total}<small> 枚</small></div>
        <p class="result-msg">おつかれさまでした。</p>
        <p class="hint">「まだ」にしたカードは、この回の最後にもう一度出しました。次回以降も優先して出てきます。</p>
        <div class="btn-row" style="justify-content:center">
          <a class="btn btn-primary" href="#cards${kind === 'people' ? '.people' : ''}">続けてめくる</a>
          <a class="btn btn-ghost" href="#practice">演習トップ</a>
        </div>
      </div>`;
    }
    keyHandler = (e) => {
      const fc = document.getElementById('fc');
      if (!fc) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        fc.classList.toggle('flipped');
      } else if (e.key === 'ArrowRight') grade(true);
      else if (e.key === 'ArrowLeft') grade(false);
    };
    if (!queue.length) {
      stage.innerHTML = '<p class="empty">この条件のカードはありません。</p>';
      return;
    }
    show();
  }

  /* =========================================================
     どっちが先？
     ========================================================= */
  function viewOrder() {
    const evs = L.timeline.filter((e) => e.s !== 'japan' || Math.random() < 0.5);
    const ROUNDS = 10;
    let round = 0;
    let score = 0;
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><span>どっちが先？</span></nav>
      <header class="lesson-head"><h1 class="lesson-title">どっちが先？</h1><p class="lesson-lead">先に起きた出来事をタップ。全${ROUNDS}問。</p></header>
      <div class="progress-line"><i id="oProg" style="width:0%"></i></div>
      <div id="oStage"></div>
    </div>`;
    const stage = view.querySelector('#oStage');
    const prog = view.querySelector('#oProg');
    function pick() {
      for (let tries = 0; tries < 200; tries++) {
        const x = evs[Math.floor(Math.random() * evs.length)];
        const y = evs[Math.floor(Math.random() * evs.length)];
        const gap = Math.abs(x.y - y.y);
        const span = Math.max(8, Math.abs(x.y) > 1500 ? 8 : 60);
        if (x !== y && gap >= 3 && gap <= Math.max(span * 12, 150)) return [x, y];
      }
      return [evs[0], evs[1]];
    }
    function show() {
      if (round >= ROUNDS) return finish();
      prog.style.width = pct(round, ROUNDS) + '%';
      const [x, y] = pick();
      stage.innerHTML = `<div class="order-q">
        <p class="hint num">${round + 1} / ${ROUNDS}</p>
        ${[x, y]
          .map(
            (ev, i) => `<button type="button" class="order-choice" data-i="${i}" data-s="${ev.s}">
              <span class="tag">${esc(sname(ev.s))}</span><span class="t">${inline(ev.t)}</span><span class="y" hidden>${esc(ev.l || yearLabel(ev.y) + '年')}</span></button>`
          )
          .join('<div class="order-vs">vs</div>')}
        <div class="qfoot"><span id="oMsg" class="hint"></span><button type="button" class="btn btn-primary" id="oNext" hidden>次へ</button></div>
      </div>`;
      let done = false;
      stage.querySelectorAll('.order-choice').forEach((b) =>
        b.addEventListener('click', () => {
          if (done) return;
          done = true;
          const i = +b.dataset.i;
          const first = x.y <= y.y ? 0 : 1;
          const ok = i === first;
          if (ok) score++;
          stage.querySelectorAll('.order-choice').forEach((c) => {
            c.disabled = true;
            c.querySelector('.y').hidden = false;
            if (+c.dataset.i === first) c.classList.add('correct');
            else if (c === b) c.classList.add('wrong');
          });
          stage.querySelector('#oMsg').textContent = ok ? '正解' : '残念';
          const nb = stage.querySelector('#oNext');
          nb.hidden = false;
          nb.focus({ preventScroll: true });
          nb.addEventListener('click', () => {
            round++;
            show();
          });
          touchDay();
          save();
        })
      );
    }
    function finish() {
      prog.style.width = '100%';
      stage.innerHTML = `<div class="card result">
        <p class="eyebrow">RESULT</p>
        <div class="result-score">${score}<small> / ${ROUNDS}</small></div>
        <p class="result-msg">${score >= 9 ? '時代感覚ばっちり。' : score >= 6 ? 'なかなか。年表で前後を確かめましょう。' : '年表をざっと眺めてから再挑戦。'}</p>
        <div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-primary" id="oAgain">もう一回</button><a class="btn" href="#timeline">年表を見る</a></div>
      </div>`;
      stage.querySelector('#oAgain').addEventListener('click', () => {
        round = 0;
        score = 0;
        show();
      });
    }
    show();
    return 'どっちが先？';
  }

  /* =========================================================
     学習記録
     ========================================================= */
  function viewRecord() {
    const rows = SUBJECTS.map((sid) => {
      const us = unitsOf(sid);
      const done = us.filter((u) => S.read[u.key]).length;
      const acc = accuracyOf((id) => sidOfQ(id) === sid);
      const keys = TERMS_BY_SID[sid].map((t) => t.key);
      const learned = keys.filter((k) => S.cards[k] && S.cards[k].b >= 3).length;
      return { sid, us, done, acc, learned, total: keys.length };
    });
    const days = new Set(S.days);
    const cells = [];
    const start = new Date();
    start.setDate(start.getDate() - 7 * 12 + 1 - start.getDay());
    for (let i = 0; i < 7 * 12 + new Date().getDay(); i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push({ k: dayKey(d), on: days.has(dayKey(d)) });
    }
    const cols = Math.ceil(cells.length / 7);
    const cw = 16;
    const svg = `<svg viewBox="0 0 ${cols * cw + 4} ${7 * cw + 4}" role="img" aria-label="最近の学習日" style="max-width:${cols * cw * 1.6}px">
      ${cells
        .map((c, i) => {
          const x = Math.floor(i / 7) * cw + 2;
          const y = (i % 7) * cw + 2;
          return `<rect x="${x}" y="${y}" width="${cw - 3}" height="${cw - 3}" rx="3" class="${c.on ? 'fg-ink' : 'fg-paper'}"><title>${c.k}${c.on ? ' 学習' : ''}</title></rect>`;
        })
        .join('')}
    </svg>`;
    view.innerHTML = `<div class="page">
      <nav class="crumbs"><a href="#practice">演習</a><span aria-hidden="true">›</span><span>学習記録</span></nav>
      <header class="lesson-head"><h1 class="lesson-title">学習記録</h1><p class="lesson-lead">記録はこの端末のブラウザにだけ保存されています。別の端末へ移すときは設定の「書き出し」を使います。</p></header>
      <section class="section">
        <h2 class="section-title">最近 12 週間</h2>
        <div class="figure" style="justify-items:start">${svg}<figcaption style="text-align:left">濃いマスが学習した日。連続 ${streak()} 日・累計 ${S.days.length} 日</figcaption></div>
      </section>
      <section class="section">
        <h2 class="section-title">科目別</h2>
        <div class="card record">
          <div class="record-row head"><span>科目</span><span>読了</span><span class="num">正答率</span><span class="num">定着語</span></div>
          ${rows
            .map(
              (r) => `<div class="record-row" data-s="${r.sid}"><span class="tag">${META[r.sid].name}</span>
              <span style="display:flex;gap:8px;align-items:center"><span class="bar" style="flex:1"><i style="width:${pct(r.done, r.us.length)}%"></i></span><span class="num">${r.done}/${r.us.length}</span></span>
              <span class="num">${r.acc.p == null ? '—' : r.acc.p + '%'}</span><span class="num">${r.learned}/${r.total}</span></div>`
            )
            .join('')}
        </div>
        <p class="hint">定着語＝暗記カードで「箱3」（1週間後の復習）以上まで進んだ用語の数。</p>
      </section>
    </div>`;
    return '学習記録';
  }

  /* =========================================================
     年表
     ========================================================= */
  const ERAS = [
    { from: -Infinity, to: -500, name: '文明のあけぼの', range: '〜前500年', jp: '日本は縄文時代' },
    { from: -500, to: 1, name: '古典古代', range: '前500年〜紀元前後', jp: '日本は縄文晩期〜弥生時代' },
    { from: 1, to: 500, name: '古代帝国の時代', range: '1〜5世紀', jp: '日本は弥生〜古墳時代' },
    { from: 500, to: 1000, name: 'ユーラシアの再編', range: '6〜10世紀', jp: '日本は飛鳥・奈良・平安時代' },
    { from: 1000, to: 1500, name: '中世の世界', range: '11〜15世紀', jp: '日本は平安後期・鎌倉・室町時代' },
    { from: 1500, to: 1700, name: '大航海と近世', range: '16〜17世紀', jp: '日本は戦国・安土桃山・江戸前期' },
    { from: 1700, to: 1800, name: '啓蒙と革命', range: '18世紀', jp: '日本は江戸中期' },
    { from: 1800, to: 1900, name: '国民国家と帝国主義', range: '19世紀', jp: '日本は江戸後期・明治' },
    { from: 1900, to: 1945, name: '二つの世界大戦', range: '1900〜1945年', jp: '日本は明治末・大正・昭和前期' },
    { from: 1945, to: 1990, name: '冷戦の時代', range: '1945〜1989年', jp: '日本は昭和後期' },
    { from: 1990, to: Infinity, name: 'グローバル化の時代', range: '1990年〜', jp: '日本は平成・令和' }
  ];
  const tlPrefs = { cats: [], q: '' };

  function viewTimeline() {
    const cats = SUBJECTS.filter((sid) => L.timeline.some((e) => e.s === sid)).concat(L.timeline.some((e) => e.s === 'japan') ? ['japan'] : []);
    const events = L.timeline.slice().sort((a, b) => a.y - b.y || (a.o || 0) - (b.o || 0));
    view.innerHTML = `<div class="page">
      <header class="lesson-head">
        <p class="eyebrow">TIMELINE</p>
        <h1 class="lesson-title">年表</h1>
        <p class="lesson-lead">世界史を軸に、政治・経済・思想の出来事を一本の時間軸に。白抜きの点はそのころの日本です。</p>
      </header>
      <div class="tl-controls">
        <label class="field">${icon('search')}<input id="tlSearch" type="search" placeholder="出来事を絞り込む（例：革命、条約）" value="${esc(tlPrefs.q)}" autocomplete="off"></label>
        <div class="chips" data-chips="cat" data-multi="true">${cats
          .map(
            (c) =>
              `<button type="button" class="chip" data-s="${c}" data-v="${c}" aria-pressed="${tlPrefs.cats.includes(c)}"><span class="dot"></span>${sname(c)}</button>`
          )
          .join('')}</div>
        <div class="tl-jump" id="tlJump">${ERAS.map((e, i) => `<button type="button" data-era="${i}">${e.range}</button>`).join('')}</div>
      </div>
      <div class="timeline" id="tl"></div>
    </div>`;
    const tl = view.querySelector('#tl');
    function draw() {
      const q = norm(tlPrefs.q);
      const list = events.filter(
        (e) => (!tlPrefs.cats.length || tlPrefs.cats.includes(e.s)) && (!q || norm(e.t + ' ' + (e.d || '')).includes(q))
      );
      tl.innerHTML =
        ERAS.map((era, i) => {
          const es = list.filter((e) => e.y >= era.from && e.y < era.to);
          if (!es.length) return '';
          return `<section id="era-${i}">
            <div class="tl-era"><h2>${era.name}</h2><span class="jp">${era.range}・${era.jp}</span></div>
            <ol class="tl-list">${es
              .map(
                (e) => `<li class="tl-item${e.s === 'japan' ? ' jp' : ''}" data-s="${e.s}">
                <span class="tl-year">${esc(e.l || yearLabel(e.y))}</span><span class="tl-rail" aria-hidden="true"></span>
                <div class="tl-body"><span class="tl-title">${inline(e.t)}</span>${e.d ? `<span class="tl-detail">${inline(e.d)}</span>` : ''}</div>
              </li>`
              )
              .join('')}</ol></section>`;
        }).join('') || '<p class="empty">条件に合う出来事がありません。</p>';
      view.querySelectorAll('#tlJump button').forEach((b) => (b.disabled = !document.getElementById('era-' + b.dataset.era)));
    }
    let tmr = 0;
    view.querySelector('#tlSearch').addEventListener('input', (e) => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        tlPrefs.q = e.target.value;
        draw();
      }, 150);
    });
    bindChips(view, 'cat', (v) => {
      tlPrefs.cats = v;
      draw();
    });
    view.querySelector('#tlJump').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const el = document.getElementById('era-' + b.dataset.era);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    draw();
    return '年表';
  }

  /* =========================================================
     辞典（用語・人物）
     ========================================================= */
  const dictPrefs = { sid: '', q: '' };
  function viewDict(a) {
    const tab = a === 'people' ? 'people' : 'terms';
    view.innerHTML = `<div class="page">
      <header class="lesson-head">
        <p class="eyebrow">GLOSSARY</p>
        <h1 class="lesson-title">辞典</h1>
      </header>
      <div class="tl-controls">
        ${segHTML('tab', [['terms', `用語 ${TERMS.length}`], ['people', `人物 ${L.people.length}`]], tab)}
        <label class="field">${icon('search')}<input id="dictSearch" type="search" placeholder="${tab === 'people' ? '人名・キーワードで絞り込む' : '用語・説明文で絞り込む'}" value="${esc(dictPrefs.q)}" autocomplete="off"></label>
        ${subjectChips(dictPrefs.sid ? [dictPrefs.sid] : [], { multi: false, name: 'dsub' })}
      </div>
      <div id="dictBody"></div>
    </div>`;
    const body = view.querySelector('#dictBody');
    function draw() {
      const q = norm(dictPrefs.q);
      if (tab === 'people') {
        const list = L.people.filter((p) => (!dictPrefs.sid || p.s === dictPrefs.sid) && (!q || norm([p.n, p.k, p.d, p.w].join(' ')).includes(q)));
        body.innerHTML = list.length ? `<div class="people">${list.map(personHTML).join('')}</div>` : '<p class="empty">該当する人物がいません。</p>';
        return;
      }
      const list = TERMS.filter((t) => (!dictPrefs.sid || t.sid === dictPrefs.sid) && (!q || norm(t.term + ' ' + t.def).includes(q)));
      if (!list.length) {
        body.innerHTML = '<p class="empty">該当する用語がありません。</p>';
        return;
      }
      const groups = [];
      list.forEach((t) => {
        const g = groups[groups.length - 1];
        if (g && g.unit === t.unit) g.items.push(t);
        else groups.push({ unit: t.unit, items: [t] });
      });
      body.innerHTML = `<div style="display:grid;gap:18px">${groups
        .map(
          (g) => `<section class="dict-group" data-s="${g.unit.sid}">
          <h3><span class="tag">${sname(g.unit.sid)}</span><a href="#learn.${g.unit.key}">第${g.unit.no}講 ${esc(g.unit.title)}</a></h3>
          <dl class="terms">${g.items.map((t) => `<div class="term"><dt><span class="k">${esc(t.term)}</span></dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl>
        </section>`
        )
        .join('')}</div>`;
    }
    bindSeg(view, 'tab', (v) => {
      location.hash = v === 'people' ? '#dict.people' : '#dict';
    });
    let tmr = 0;
    view.querySelector('#dictSearch').addEventListener('input', (e) => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        dictPrefs.q = e.target.value;
        draw();
      }, 120);
    });
    bindChips(view, 'dsub', (v) => {
      dictPrefs.sid = v[0] || '';
      draw();
    });
    setSheetAvailable(true);
    draw();
    return tab === 'people' ? '人物' : '用語';
  }

  /* =========================================================
     検索
     ========================================================= */
  let lastQuery = '';
  function snippet(text, q, len = 60) {
    const n = norm(text);
    const i = n.indexOf(q);
    if (i < 0) return esc(text.slice(0, len)) + (text.length > len ? '…' : '');
    const s = Math.max(0, i - 24);
    const part = text.slice(s, s + len + q.length);
    const j = norm(part).indexOf(q);
    return (
      (s > 0 ? '…' : '') +
      esc(part.slice(0, j)) +
      '<mark>' +
      esc(part.slice(j, j + q.length)) +
      '</mark>' +
      esc(part.slice(j + q.length)) +
      (s + part.length < text.length ? '…' : '')
    );
  }
  const UNIT_TEXT = {};
  UNITS.forEach((u) => (UNIT_TEXT[u.key] = plain([u.lead, (u.points || []).join(' '), u.body].join(' '))));

  function viewSearch() {
    view.innerHTML = `<div class="page">
      <header class="lesson-head"><p class="eyebrow">SEARCH</p><h1 class="lesson-title">検索</h1></header>
      <label class="field">${icon('search')}<input id="q" type="search" placeholder="例：違憲審査権、インフレ、カント、モンスーン" value="${esc(lastQuery)}" autocomplete="off" enterkeyhint="search"></label>
      <div class="results" id="results"></div>
    </div>`;
    const input = view.querySelector('#q');
    const out = view.querySelector('#results');
    function run() {
      const q = norm(input.value.trim());
      lastQuery = input.value;
      if (!q) {
        out.innerHTML = `<p class="hint">講の本文、用語、人物、年表の出来事をまとめて探します。</p>`;
        return;
      }
      const us = UNITS.filter((u) => norm(u.title).includes(q) || norm(UNIT_TEXT[u.key]).includes(q))
        .sort((a, b) => (norm(b.title).includes(q) ? 1 : 0) - (norm(a.title).includes(q) ? 1 : 0))
        .slice(0, 30);
      const ts = TERMS.filter((t) => norm(t.term + ' ' + t.def).includes(q))
        .sort((a, b) => (norm(b.term).includes(q) ? 1 : 0) - (norm(a.term).includes(q) ? 1 : 0))
        .slice(0, 40);
      const ps = L.people.filter((p) => norm([p.n, p.k, p.d, p.w].join(' ')).includes(q)).slice(0, 20);
      const es = L.timeline.filter((e) => norm(e.t + ' ' + (e.d || '')).includes(q)).slice(0, 30);
      const group = (title, items) => (items ? `<section class="result-group"><h2>${title}</h2>${items}</section>` : '');
      out.innerHTML =
        group(
          `講 ${us.length}`,
          us
            .map(
              (u) => `<a class="card hit" data-s="${u.sid}" href="#learn.${u.key}"><span class="hit-title"><span class="tag">${sname(u.sid)} 第${u.no}講</span>${esc(
                u.title
              )}</span><span class="hit-snip">${snippet(UNIT_TEXT[u.key], q, 70)}</span></a>`
            )
            .join('')
        ) +
        group(
          `用語 ${ts.length}`,
          ts
            .map(
              (t) => `<a class="card hit" data-s="${t.sid}" href="#learn.${t.unit.key}"><span class="hit-title"><span class="tag">${sname(t.sid)}</span>${snippet(
                t.term,
                q,
                40
              )}</span><span class="hit-snip">${snippet(t.def, q, 70)}</span></a>`
            )
            .join('')
        ) +
        group(
          `人物 ${ps.length}`,
          ps
            .map(
              (p) => `<a class="card hit" data-s="${p.s}" href="#dict.people"><span class="hit-title"><span class="tag">${sname(p.s)}</span>${esc(p.n)}</span><span class="hit-snip">${snippet(
                plain(p.k + ' ' + (p.d || '')),
                q,
                70
              )}</span></a>`
            )
            .join('')
        ) +
        group(
          `年表 ${es.length}`,
          es
            .map(
              (e) => `<a class="card hit" data-s="${e.s}" href="#timeline"><span class="hit-title"><span class="tag num">${esc(e.l || yearLabel(e.y))}</span>${snippet(
                plain(e.t),
                q,
                60
              )}</span>${e.d ? `<span class="hit-snip">${snippet(plain(e.d), q, 70)}</span>` : ''}</a>`
            )
            .join('')
        );
      if (!out.innerHTML) out.innerHTML = `<p class="empty">「${esc(input.value)}」は見つかりませんでした。別の言い方で試してください。</p>`;
    }
    let tmr = 0;
    input.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(run, 120);
    });
    run();
    setTimeout(() => input.focus({ preventScroll: true }), 50);
    return '検索';
  }

  /* =========================================================
     設定
     ========================================================= */
  function viewSettings() {
    view.innerHTML = `<div class="page">
      <header class="lesson-head"><p class="eyebrow">SETTINGS</p><h1 class="lesson-title">設定</h1></header>
      <div class="card settings">
        <div class="set-row"><div><div class="lbl">表示テーマ</div><div class="sub">「自動」は端末の設定に合わせます</div></div>
          ${segHTML('theme', [['system', '自動'], ['light', 'ライト'], ['dark', 'ダーク']], S.theme)}</div>
        <div class="set-row"><div><div class="lbl">文字の大きさ</div></div>
          ${segHTML('size', [['s', '小'], ['m', '標準'], ['l', '大']], S.size)}</div>
      </div>

      <section class="section">
        <h2 class="section-title">記録の引っ越し</h2>
        <div class="card settings">
          <div class="set-row" style="display:grid">
            <div><div class="lbl">書き出し</div><div class="sub">下の文字列をコピーして、別の端末の「読み込み」に貼り付けます。</div></div>
            <textarea class="io" id="exportBox" readonly></textarea>
            <div class="btn-row"><button type="button" class="btn btn-sm" id="copyBtn">コピー</button></div>
          </div>
          <div class="set-row" style="display:grid">
            <div><div class="lbl">読み込み</div><div class="sub">書き出した文字列を貼り付けて読み込みます。いまの記録は上書きされます。</div></div>
            <textarea class="io" id="importBox" placeholder="ここに貼り付け"></textarea>
            <div class="btn-row"><button type="button" class="btn btn-sm" id="importBtn">読み込む</button></div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">記録を消す</h2>
        <div class="card settings"><div class="set-row"><div><div class="lbl">すべての学習記録を消去</div><div class="sub">読了・解答・カードの記録が消えます。元に戻せません。</div></div>
          <button type="button" class="btn btn-sm btn-ng" id="resetBtn">消去する…</button></div></div>
        <div class="confirm" id="resetConfirm" hidden>
          <p>本当にすべての記録を消しますか？</p>
          <div class="btn-row"><button type="button" class="btn btn-sm btn-ng" id="resetYes">消去する</button><button type="button" class="btn btn-sm btn-ghost" id="resetNo">やめる</button></div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">このノートについて</h2>
        <div class="prose" style="font-size:.92rem">
          <p>高校の「政治・経済」「倫理」「地理」「世界史」の範囲から、大人として知っておきたい基礎をまとめた個人用の学習ノートです。全${UNITS.length}講・用語${TERMS.length}語・人物${L.people.length}人・年表${L.timeline.length}件。</p>
          <p>統計や制度の数字は執筆時点（2020年代半ば）のものです。最新の値は官公庁の資料で確かめてください。</p>
        </div>
      </section>
    </div>`;
    bindSeg(view, 'theme', (v) => {
      S.theme = v;
      save();
      applyTheme();
    });
    bindSeg(view, 'size', (v) => {
      S.size = v;
      save();
      applyTheme();
    });
    const exp = view.querySelector('#exportBox');
    const payload = JSON.stringify({ app: 'otona-shakai', v: 1, read: S.read, q: S.q, cards: S.cards, days: S.days });
    exp.value = payload;
    view.querySelector('#copyBtn').addEventListener('click', () => {
      const fallback = () => {
        exp.focus();
        exp.select();
        toast('選択しました。コピーしてください');
      };
      try {
        navigator.clipboard.writeText(payload).then(() => toast('コピーしました'), fallback);
      } catch (e) {
        fallback();
      }
    });
    view.querySelector('#importBtn').addEventListener('click', () => {
      try {
        const d = JSON.parse(view.querySelector('#importBox').value);
        if (!d || d.app !== 'otona-shakai') throw new Error('bad');
        ['read', 'q', 'cards'].forEach((k) => {
          if (d[k] && typeof d[k] === 'object') S[k] = d[k];
        });
        if (Array.isArray(d.days)) S.days = d.days;
        save();
        toast('記録を読み込みました');
        route();
      } catch (e) {
        toast('読み込めませんでした。書き出した文字列をそのまま貼ってください');
      }
    });
    const conf = view.querySelector('#resetConfirm');
    view.querySelector('#resetBtn').addEventListener('click', () => (conf.hidden = false));
    view.querySelector('#resetNo').addEventListener('click', () => (conf.hidden = true));
    view.querySelector('#resetYes').addEventListener('click', () => {
      const keep = { theme: S.theme, size: S.size };
      S = Object.assign(DEFAULTS(), keep);
      save();
      toast('記録を消去しました');
      route();
    });
    return '設定';
  }

  /* =========================================================
     起動
     ========================================================= */
  /* Web フォントは後から読み込む（回線が遅くても本文の表示を止めない） */
  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@700&family=BIZ+UDPGothic:wght@400;700&family=Klee+One:wght@600&display=swap';
  if (!document.querySelector('link[data-fonts]')) {
    const fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = FONT_CSS;
    fl.dataset.fonts = '';
    document.head.appendChild(fl);
  }
  load();
  applyTheme();
  buildChrome();
  route();

  if (!window.LEARN_STANDALONE && 'serviceWorker' in navigator && /^https:$|^http:$/.test(location.protocol) && !/claude/.test(location.hostname)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
