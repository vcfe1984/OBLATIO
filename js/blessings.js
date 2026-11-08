// 祝福禮典 — Book of Blessings viewer for OBLATIO.
// Data: data/blessings.json (build/blessings/build_blessings.py, then polish_blessings.py): parts → chapters → blocks.
// Only the readings printed in the book are kept (citation-only options removed, Fr. Gervais 8 Nov 2026).
// Index as numbered cards by part; in a rite, a sticky bar of its steps (開始禮 … 結束禮) and the 前言 folded away.
let B = null;
export async function loadBlessings(base = 'data/') {
  if (!B) B = await (await fetch(base + 'blessings.json')).json();
  return B;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SPK = /^(主禮|主祭|眾答|眾|全體|領|啟|應|讀經員|執事|輔祭|司鐸|父母|答)([（(][^）)]{0,12}[)）])?(答)?[：:]/;
const STEP_BAR = ['祝福儀式', '開始禮', '恭讀聖經', '聖道禮儀', '宣讀天主聖言', '接納候洗者', '信友禱詞', '謝恩祈禱', '祝福經文', '祝福聖洗泉', '祝福新聖洗泉',
  '重宣聖洗誓願', '頌揚聖架', '授十字架', '授與聖衣', '感恩祭或信友禱詞', '短式祝福經文', '短經', '結束禮', '禮成式'];
function inl(s) {
  return esc(s).replace(/（([^（）]{1,16})）/g, (m, x) => (/^(某|\d)/.test(x) ? m : `<span class="ri">（${x}）</span>`))
    .replace(/✠/g, '<span class="ri">✠</span>').replace(/【答】/g, '<span class="ri">【答】</span>');
}
function line(b, i) {
  const t = b.t;
  if (b.k === 'section') return `<h2 class="m-sec" id="${b.id}">${esc(t)}</h2>`;
  if (b.k === 'sub') return `<h3 class="m-h b-sub" id="${b.id}">${esc(t)}</h3>`;
  if (b.k === 'h') return `<h3 class="m-h"${STEP_BAR.includes(t) ? ` data-step="${esc(t)}" id="bs${i}"` : ''}>${esc(t)}</h3>`;
  if (b.k === 'rub') return `<p class="rub">${inl(t)}</p>`;
  if (b.k === 'opt') return `<p class="m-p ropt">${esc(t)}</p>`;
  if (b.k === 'resp') return `<p class="m-p"><span class="spk">答：</span>${inl(t.replace(/^答[：:]\s*/, ''))}</p>`;
  const m = t.match(SPK);
  if (m) return `<p class="m-p"><span class="spk">${esc(t.slice(0, m[0].length - 1))}：</span>${inl(t.slice(m[0].length))}</p>`;
  if (/^[\-－—一]\s*求/.test(t)) return `<p class="m-p b-pet">—${inl(t.replace(/^[\-－—一]\s*/, ''))}</p>`;
  return `<p class="m-p">${inl(t)}</p>`;
}
// 「第十二章新學校或大學祝福儀式」 → { n: '十二', title: '新學校或大學祝福儀式' }
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnum(s) { let n = 0, cur = 0; for (const ch of s) { if (ch === '十') { n += (cur || 1) * 10; cur = 0; } else cur = CN[ch] || 0; } return n + cur; }
function splitTitle(t) {
  const m = t.match(/^第([一二三四五六七八九十]+)章(㈠|㈡)?\s*(.*)$/);
  return m ? { n: cnum(m[1]) + (m[2] || ''), title: m[3] } : { n: '', title: t };
}
const partTitle = (t) => t.replace(/^(第[一二三四五]部分)\s*/, '$1　');
const chapters = () => B.parts.flatMap((p) => p.chapters.map((c) => ({ p, c })));

export function renderIndex(q = '') {
  const ql = q.trim();
  const out = [`<h1 class="mtitle">祝福禮典</h1>`,
    `<input class="b-search" type="search" placeholder="搜尋：家庭、病人、房屋、念珠…" value="${esc(q)}" data-b="search" aria-label="搜尋祝福">`];
  let any = false;
  for (const p of B.parts) {
    if (!p.chapters.length) continue;
    const chs = p.chapters.filter((c) => !ql || c.title.includes(ql) || c.sections.some((s) => s.title.includes(ql)));
    if (!chs.length) continue;
    any = true;
    out.push(`<h2 class="b-group">${esc(partTitle(p.title))}</h2><div class="b-grid">`);
    for (const c of chs) {
      const { n, title } = splitTitle(c.title);
      const secs = c.sections.filter((s) => s.level === 1 && /、/.test(s.title) && (!ql || s.title.includes(ql) || c.title.includes(ql)));
      out.push(`<div class="b-card"><a href="#" class="b-main" data-chap="${c.id}"><span class="b-num">${n}</span><span class="b-tt">${esc(title)}</span><span class="b-arr" aria-hidden="true">›</span></a>` +
        (secs.length > 1 ? `<div class="b-secs">${secs.map((s) => `<a href="#" data-chap="${c.id}" data-sec="${s.id}">${esc(s.title)}</a>`).join('')}</div>` : '') + '</div>');
    }
    out.push('</div>');
  }
  if (!any) out.push('<p class="empty">找不到相符的祝福。</p>');
  out.push(`<div class="notes b-src"><p>中國主教團禮儀委員會編譯《祝福禮典》（1984年拉丁文版）。只保留書中印出全文的讀經；其他僅列出章節的讀經選項已刪去。用語已按香港教區習慣（亞孟等）。</p></div>`);
  return out.join('');
}
export function findChapter(id) {
  for (const p of B.parts) for (const c of p.chapters) if (c.id === id) return { p, c };
  return null;
}
export function renderChapter(id) {
  const r = findChapter(id); if (!r) return '<p class="empty">找不到此祝福儀式。</p>';
  const { p, c } = r;
  const { n, title } = splitTitle(c.title);
  const secs = c.sections.filter((s) => s.level === 1);
  // 前言 (pastoral notes) folded into a <details>, from its heading to the next heading or section
  const html = []; let intro = false;
  c.blocks.forEach((b, i) => {
    if (intro && (b.k === 'h' || b.k === 'section' || b.k === 'sub')) { html.push('</div></details>'); intro = false; }
    if (b.k === 'h' && b.t === '前言') { html.push('<details class="b-intro"><summary>前言（牧民指引）</summary><div>'); intro = true; return; }
    html.push(line(b, i));
  });
  if (intro) html.push('</div></details>');
  const steps = [...new Set(c.blocks.filter((b) => b.k === 'h' && STEP_BAR.includes(b.t)).map((b) => b.t))];
  const all = chapters(), k = all.findIndex((x) => x.c.id === id);
  const nav = (x, lab) => (x ? `<a href="#" class="pill" data-chap="${x.c.id}">${lab}${esc(splitTitle(x.c.title).title)}</a>` : '');
  return `<p class="b-crumb"><a href="#" data-b="index">‹ 祝福禮典</a>　${esc(partTitle(p.title))}</p>` +
    `<h1 class="mtitle">${n ? `<span class="b-num">${n}</span>` : ''}${esc(title)}</h1>` +
    (secs.length > 1 ? `<div class="tabs b-jump">${secs.map((s) => `<button class="pill" data-jump="${s.id}">${esc(s.title)}</button>`).join('')}</div>` : '') +
    (steps.length > 1 ? `<nav class="b-steps" aria-label="禮儀步驟">${steps.map((s) => `<button data-step-go="${esc(s)}">${esc(s)}</button>`).join('')}</nav>` : '') +
    `<div class="mass b-rite">${html.join('')}</div>` +
    `<div class="mbtns"><button class="pill" data-b="print">列印</button><button class="pill" data-b="index">回到目錄</button></div>` +
    `<div class="b-prevnext">${nav(all[k - 1], '‹ ')}${nav(all[k + 1], '› ')}</div>`;
}
/** step bar: go to the next heading of that step below the current reading position (else the first one) */
export function goStep(root, label) {
  const hs = [...root.querySelectorAll('[data-step]')].filter((h) => h.dataset.step === label);
  if (!hs.length) return;
  const bar = root.querySelector('.b-steps'); const top = (document.querySelector('.top')?.offsetHeight || 0) + (bar?.offsetHeight || 0) + 8;
  const next = hs.find((h) => h.getBoundingClientRect().top > top + 40) || hs[0];
  window.scrollTo({ top: window.scrollY + next.getBoundingClientRect().top - top, behavior: 'smooth' });
}
