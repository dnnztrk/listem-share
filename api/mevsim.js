'use strict';
/*
 * Mevsim Takvimi (list-em.app/mevsim): Türkiye'de hangi meyve, sebze ve balık ne zaman mevsiminde.
 * Veri uygulamanın kataloğundan (public/data/catalog.json) gelir; mevsim etiketleri uygulamanın
 * kendi etiketleri. Sayfa betiksiz de çalışır: sunucu içinde bulunulan ayı seçili çizer.
 */
const site = require('./_site');
const catalog = require('../public/data/catalog.json');
const { esc } = site;

const GROUPS = ['Fruit', 'Vegetables', 'Fish'];
const CATS = new Map(catalog.categories.map((c) => [c.id, c]));

const T = {
  tr: {
    title: 'Mevsim Takvimi',
    lead: 'Türkiye’de hangi meyve, sebze ve balığın ne zaman mevsiminde olduğunu ay ay gör.',
    months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    short: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    inMonth: ['Ocak’ta', 'Şubat’ta', 'Mart’ta', 'Nisan’da', 'Mayıs’ta', 'Haziran’da', 'Temmuz’da', 'Ağustos’ta', 'Eylül’de', 'Ekim’de', 'Kasım’da', 'Aralık’ta'],
    count: (m, n) => m + ' ' + n + ' ürün mevsiminde.',
    all: 'Hepsi',
    group: { Fruit: 'Meyve', Vegetables: 'Sebze', Fish: 'Balık' },
    fresh: 'Yeni başladı', last: 'Son ay',
    thisMonth: 'bu ay',
    yearRound: 'Yıl boyu bulunanlar',
    yearRoundNote: 'Bunların belirli bir mevsimi yok; yılın her ayı bulunur.',
    monthsLabel: 'Ay', filterLabel: 'Tür',
    metaDesc: 'Türkiye’de meyve, sebze ve balığın mevsimi, ay ay. Hangi ürün ne zaman mevsiminde, hangisi yeni başladı, hangisi son ayında.',
  },
  en: {
    title: 'Seasonal Calendar',
    lead: 'See, month by month, which fruit, vegetables and fish are in season in Turkey.',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    inMonth: ['In January,', 'In February,', 'In March,', 'In April,', 'In May,', 'In June,', 'In July,', 'In August,', 'In September,', 'In October,', 'In November,', 'In December,'],
    count: (m, n) => m + ' ' + n + (n === 1 ? ' item is' : ' items are') + ' in season.',
    all: 'All',
    group: { Fruit: 'Fruit', Vegetables: 'Vegetables', Fish: 'Fish' },
    fresh: 'Just in', last: 'Last month',
    thisMonth: 'this month',
    yearRound: 'Available all year',
    yearRoundNote: 'These have no particular season; you can find them every month.',
    monthsLabel: 'Month', filterLabel: 'Kind',
    metaDesc: 'Which fruit, vegetables and fish are in season in Turkey, month by month — what has just arrived and what is in its last month.',
  },
};

function istanbulMonth() {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', month: 'numeric' }).format(new Date())); }
  catch (e) { return new Date().getMonth() + 1; }
}

/* Mevsimin ilk ve son ayı (yıl sonundan başa sarabilir: Kasım–Nisan gibi). */
function edges(months) {
  const set = new Set(months);
  const prev = (m) => (m === 1 ? 12 : m - 1), next = (m) => (m === 12 ? 1 : m + 1);
  return {
    starts: months.filter((m) => !set.has(prev(m))),
    ends: months.filter((m) => !set.has(next(m))),
  };
}

function build(lang) {
  const seasonal = [], yearRound = [];
  catalog.products.forEach((p) => {
    if (!p.season) return;
    const name = lang === 'en' ? p.nameEn : p.nameTr;
    if (p.season.yearRound) { yearRound.push({ name, emoji: p.emoji }); return; }
    if (!GROUPS.includes(p.category)) return;
    const e = edges(p.season.months);
    seasonal.push({
      name, emoji: p.emoji, cat: p.category, months: p.season.months.slice().sort((a, b) => a - b),
      label: lang === 'en' ? p.season.labelEn : p.season.labelTr, kind: p.season.kind, starts: e.starts, ends: e.ends,
    });
  });
  const collator = new Intl.Collator(lang === 'en' ? 'en' : 'tr');
  seasonal.sort((a, b) => collator.compare(a.name, b.name));
  yearRound.sort((a, b) => collator.compare(a.name, b.name));
  return { seasonal, yearRound };
}

const CSS = `
.cal{max-width:760px;margin:0 auto}
.cal-head{padding:20px 0 4px}
.cal-head h1{margin:0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:34px;letter-spacing:-.02em;line-height:1.05}
.cal-head p{margin:10px 0 0;font-size:15px;line-height:1.45;color:var(--text2);max-width:34em}
.months{display:flex;gap:6px;overflow-x:auto;margin:22px -16px 0;padding:2px 16px 6px;scrollbar-width:none;scroll-snap-type:x proximity}
.months::-webkit-scrollbar{display:none}
.mo{position:relative;flex:none;min-width:52px;min-height:44px;padding:0 10px;border-radius:12px;border:.5px solid var(--border);background:var(--surface);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;scroll-snap-align:center}
.mo[aria-selected="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.mo.now::after{content:"";position:absolute;left:50%;bottom:6px;width:4px;height:4px;margin-left:-2px;border-radius:2px;background:var(--accent)}
.mo.now[aria-selected="true"]::after{background:#fff}
.mo:active{opacity:.6}
.kinds{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.kind{min-height:36px;padding:0 14px;border-radius:999px;border:.5px solid var(--border);background:transparent;color:var(--text2);font-size:13px;font-weight:600;cursor:pointer}
.kind[aria-pressed="true"]{background:var(--accent-muted);border-color:transparent;color:var(--accent)}
.kind:active{opacity:.6}
.count{margin:18px 0 0;font-size:13px;font-weight:600;color:var(--text2)}
.grp[hidden]{display:none}
.grp h2{display:flex;align-items:center;gap:8px;margin:0;padding:24px 0 8px;font-size:13px;font-weight:600;color:var(--text2)}
.grp ul{list-style:none;margin:0;padding:0}
.sr{position:relative;display:flex;align-items:center;min-height:56px;padding:12px 16px;background:var(--surface)}
.sr[hidden]{display:none}
.sr.after::before{content:"";position:absolute;left:0;top:0;width:68px;height:var(--hair);background:var(--bg)}
.sr.after::after{content:"";position:absolute;left:68px;right:0;top:0;height:var(--hair);background:var(--border)}
.sr .emoji{flex:none;width:36px;height:36px;margin-right:16px;border-radius:8px;background:var(--emoji-bg);display:flex;align-items:center;justify-content:center;font-size:16px}
.sr .txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.sr .l1{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.sr .name{font-size:16px;font-weight:600;letter-spacing:-.2px}
.sr .l2{font-size:11px;color:var(--text2)}
.flag{flex:none;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;font-style:italic;background:var(--land-bg);color:var(--land-ink)}
.flag[hidden]{display:none}
.sr.sea .flag{background:var(--sea-bg);color:var(--sea-ink)}
.yr{flex:none;display:grid;grid-template-columns:repeat(12,6px);gap:3px;margin-left:12px}
.yr i{width:6px;height:6px;border-radius:3px;background:var(--track)}
.yr i.on{background:var(--accent)}
.sr.sea .yr i.on{background:var(--sea-ink)}
.yr i.sel{box-shadow:0 0 0 1.5px var(--bg),0 0 0 3px var(--text2)}
.empty{margin:24px 0 0;font-size:15px;color:var(--text2)}
.always{margin-top:40px}
.always h2{margin:0;font-size:13px;font-weight:600;color:var(--text2)}
.always p{margin:6px 0 0;font-size:13px;color:var(--text2)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.chip{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 10px;border-radius:999px;background:var(--surface);font-size:13px;font-weight:500}
@media (min-width:900px){
  .cal-head{padding-top:32px}
  .cal-head h1{font-size:44px}
  .months{display:grid;grid-template-columns:repeat(12,1fr);margin:26px 0 0;padding:0;overflow:visible}
  .mo{min-width:0;padding:0}
}
@media (max-width:360px){.yr{grid-template-columns:repeat(12,5px);gap:2px}.yr i{width:5px;height:5px}}
`;

const CLIENT = `
(function(){
  var D = JSON.parse(document.getElementById('cal-data').textContent);
  var month = D.month, kind = 'all';
  var q = new URLSearchParams(location.search);
  if (+q.get('ay') >= 1 && +q.get('ay') <= 12) month = +q.get('ay');
  if (['Fruit','Vegetables','Fish'].indexOf(q.get('tur')) >= 0) kind = q.get('tur');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.sr'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.grp'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.mo'));
  var kinds = Array.prototype.slice.call(document.querySelectorAll('.kind'));
  var countEl = document.getElementById('count'), emptyEl = document.getElementById('empty');
  function apply(push){
    var total = 0;
    tabs.forEach(function(b){ b.setAttribute('aria-selected', +b.getAttribute('data-m') === month ? 'true' : 'false'); });
    kinds.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-k') === kind ? 'true' : 'false'); });
    groups.forEach(function(g){
      var gk = g.getAttribute('data-k'), shown = 0, prevShown = false;
      g.querySelectorAll('.sr').forEach(function(r){
        var ms = r.getAttribute('data-m').split(',').map(Number);
        var on = ms.indexOf(month) >= 0 && (kind === 'all' || kind === gk);
        r.hidden = !on;
        if (on) {
          shown++;
          r.classList.toggle('after', prevShown);
          prevShown = true;
          var st = r.getAttribute('data-s').split(',').map(Number), en = r.getAttribute('data-e').split(',').map(Number);
          var f = r.querySelector('.flag');
          if (st.indexOf(month) >= 0) { f.textContent = D.t.fresh; f.hidden = false; }
          else if (en.indexOf(month) >= 0) { f.textContent = D.t.last; f.hidden = false; }
          else f.hidden = true;
          r.querySelectorAll('.yr i').forEach(function(d, i){ d.classList.toggle('sel', i + 1 === month); });
        }
      });
      g.hidden = shown === 0;
      g.querySelector('.n').textContent = shown;
      total += shown;
    });
    countEl.textContent = D.t.count.replace('{m}', D.t.inMonth[month - 1]).replace('{n}', total);
    emptyEl.hidden = total > 0;
    if (push) {
      var u = new URL(location.href);
      u.searchParams.set('ay', month);
      if (kind === 'all') u.searchParams.delete('tur'); else u.searchParams.set('tur', kind);
      history.replaceState(null, '', u.pathname + u.search);
    }
  }
  tabs.forEach(function(b){ b.addEventListener('click', function(){ month = +b.getAttribute('data-m'); apply(true); }); });
  kinds.forEach(function(b){ b.addEventListener('click', function(){ kind = b.getAttribute('data-k'); apply(true); }); });
  apply(false);
  var sel = document.querySelector('.mo[aria-selected="true"]');
  if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
})();
`;

function render(lang, host) {
  const t = T[lang];
  const now = istanbulMonth();
  const data = build(lang);
  const tabs = t.short.map((s, i) =>
    '<button type="button" class="mo' + (i + 1 === now ? ' now' : '') + '" role="tab" data-m="' + (i + 1) + '" aria-selected="' + (i + 1 === now) + '" aria-label="' + esc(t.months[i]) + (i + 1 === now ? ' (' + esc(t.thisMonth) + ')' : '') + '">' + esc(s) + '</button>'
  ).join('');
  const kinds = [['all', t.all]].concat(GROUPS.map((g) => [g, t.group[g]])).map(([k, label]) =>
    '<button type="button" class="kind" data-k="' + k + '" aria-pressed="' + (k === 'all') + '">' + esc(label) + '</button>'
  ).join('');
  let total = 0;
  const groupsHtml = GROUPS.map((g) => {
    const items = data.seasonal.filter((p) => p.cat === g);
    let shown = 0;
    const rows = items.map((p) => {
      const on = p.months.includes(now);
      if (on) shown++;
      const flag = on && p.starts.includes(now) ? t.fresh : on && p.ends.includes(now) ? t.last : '';
      const dots = Array.from({ length: 12 }, (_, i) => '<i' + (p.months.includes(i + 1) ? ' class="on' + (i + 1 === now ? ' sel' : '') + '"' : (i + 1 === now ? ' class="sel"' : '')) + '></i>').join('');
      return '<li class="sr' + (p.kind === 'sea' ? ' sea' : '') + (on && shown > 1 ? ' after' : '') + '"' + (on ? '' : ' hidden') +
        ' data-m="' + p.months.join(',') + '" data-s="' + p.starts.join(',') + '" data-e="' + p.ends.join(',') + '">' +
        '<span class="emoji" aria-hidden="true">' + esc(p.emoji) + '</span>' +
        '<span class="txt"><span class="l1"><span class="name">' + esc(p.name) + '</span><span class="flag"' + (flag ? '' : ' hidden') + '>' + esc(flag) + '</span></span>' +
        '<span class="l2">' + esc(p.label) + '</span></span>' +
        '<span class="yr" aria-hidden="true">' + dots + '</span></li>';
    }).join('');
    total += shown;
    const cat = CATS.get(g) || {};
    return '<section class="grp" data-k="' + g + '"' + (shown ? '' : ' hidden') + '><h2><span aria-hidden="true">' + esc(cat.emoji || '') + '</span>' + esc(t.group[g]) + ' · <span class="n">' + shown + '</span></h2><ul>' + rows + '</ul></section>';
  }).join('');
  const chips = data.yearRound.map((p) => '<span class="chip"><span aria-hidden="true">' + esc(p.emoji) + '</span>' + esc(p.name) + '</span>').join('');
  const langHref = '/mevsim?lang=' + (lang === 'tr' ? 'en' : 'tr');

  const body = '<div class="wrap">' + site.header(lang, langHref, 'season') +
    '<main class="cal">' +
    '<div class="cal-head"><h1>' + esc(t.title) + '</h1><p>' + esc(t.lead) + '</p></div>' +
    '<div class="months" role="tablist" aria-label="' + esc(t.monthsLabel) + '">' + tabs + '</div>' +
    '<div class="kinds" role="group" aria-label="' + esc(t.filterLabel) + '">' + kinds + '</div>' +
    '<p class="count" id="count" aria-live="polite">' + esc(t.count(t.inMonth[now - 1], total)) + '</p>' +
    groupsHtml +
    '<p class="empty" id="empty" hidden>—</p>' +
    '<section class="always"><h2>' + esc(t.yearRound) + '</h2><p>' + esc(t.yearRoundNote) + '</p><div class="chips">' + chips + '</div></section>' +
    '</main>' + site.footer(lang, '') + '</div>';

  const json = JSON.stringify({ month: now, t: { count: t.count('{m}', '{n}').replace(/ \{n\}/, ' {n}'), inMonth: t.inMonth, fresh: t.fresh, last: t.last } }).replace(/</g, '\\u003c');
  return site.pageShell({
    lang,
    title: t.title + ' · List-em',
    description: t.metaDesc,
    ogDescription: t.metaDesc,
    host,
    css: CSS,
    body,
    scripts: '<script type="application/json" id="cal-data">' + json + '</script>\n<script>' + CLIENT + '</script>\n',
    index: true,
  });
}

module.exports = (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  const host = req.headers.host || 'list-em.app';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(lang, host));
};
module.exports.render = render;
