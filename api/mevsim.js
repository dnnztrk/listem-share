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
    starting: 'Bu ay başlayanlar', ending: 'Son ayında', more: '+{n} daha',
    noneStart: 'Bu ay mevsimi başlayan ürün yok.', noneEnd: 'Bu ay mevsimi biten ürün yok.',
    explain: 'Her şerit, ürünün yıl içinde mevsiminde olduğu ayları gösterir; dikey bant seçtiğin ay.', legendOn: 'Mevsiminde', legendSel: 'Seçili ay',
    chart: 'Mevsim çizelgesi', poster: 'Ekim pazarı: nar, ayva, Trabzon hurması, mandalina, kestane ve hamsi; düz çizim bir afiş.',
    metaDesc: 'Türkiye’de meyve, sebze ve balığın mevsimi, ay ay. Hangi ürün ne zaman mevsiminde, hangisi yeni başladı, hangisi son ayında.',
  },
  en: {
    title: 'Seasonal Calendar',
    lead: 'See, month by month, which fruit, vegetables and fish are in season in Türkiye.',
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
    starting: 'Just in this month', ending: 'In their last month', more: '+{n} more',
    noneStart: 'Nothing comes into season this month.', noneEnd: 'Nothing goes out of season this month.',
    explain: 'Each bar shows the months a product is in season; the vertical band is the month you picked.', legendOn: 'In season', legendSel: 'Selected month',
    chart: 'Season chart', poster: 'An October market: pomegranates, quinces, persimmons, tangerines, chestnuts and anchovies, drawn as a flat poster.',
    metaDesc: 'Which fruit, vegetables and fish are in season in Türkiye, month by month — what has just arrived and what is in its last month.',
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
    if (p.season.yearRound) { yearRound.push({ id: p.id, name, emoji: p.emoji, cat: p.category }); return; }
    if (!GROUPS.includes(p.category)) return;
    const e = edges(p.season.months);
    seasonal.push({
      id: p.id, name, emoji: p.emoji, cat: p.category, months: p.season.months.slice().sort((a, b) => a - b),
      label: lang === 'en' ? p.season.labelEn : p.season.labelTr, kind: p.season.kind, starts: e.starts, ends: e.ends,
    });
  });
  const collator = new Intl.Collator(lang === 'en' ? 'en' : 'tr');
  seasonal.sort((a, b) => collator.compare(a.name, b.name));
  yearRound.sort((a, b) => collator.compare(a.name, b.name));
  return { seasonal, yearRound };
}


/* Ürün işaretleri: çizimi olanlar çizimle, diğerleri uygulamadaki emojiyle. Çizim seti büyüdükçe buraya eklenir. */
const PIECE = { nar: 'nar', ayva: 'ayva', 'trabzon-hurmasi': 'hurma', mandalina: 'mandalina', hamsi: 'hamsi' };
const icon = (id, emoji) => PIECE[id] ? '<span class="ico"><img src="/img/pazar/' + PIECE[id] + '.webp" alt="" loading="lazy"></span>' : '<span class="ico" aria-hidden="true">' + esc(emoji) + '</span>';

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .12 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const DARK = (sel) => '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ' + sel + '}\n:root[data-theme="dark"] ' + sel + '\n';

const CSS = `
:root{--vine:#3F6E48;--tile:rgba(255,255,255,.6);--gridline:rgba(43,33,24,.06);--paper:#F7E8CE;--ink:#2B2118;--ink2:#6A5D4E;--ink3:#4A3F33;--rule:rgba(43,33,24,.1);--band:rgba(45,139,117,.13);--chip:rgba(255,255,255,.55);--c-Fruit:#E0703A;--c-Vegetables:#4C8A55;--c-Fish:#3C6893;--namew:118px}
body.paper{background:var(--paper)}
body.paper::before{content:"";position:fixed;inset:0;background-image:${GRAIN};opacity:.16;mix-blend-mode:multiply;pointer-events:none;z-index:30}
${DARK('.cal{--vine:#4E8B5A;--tile:var(--surface);--gridline:rgba(255,255,255,.05);--ink:var(--text);--ink2:var(--text2);--ink3:var(--text2);--rule:rgba(255,255,255,.08);--band:rgba(56,182,150,.16);--chip:var(--surface);--c-Fruit:#F0864E;--c-Vegetables:#63A36C;--c-Fish:#5A8CBF}')}
${DARK('body.paper{background:var(--bg)}')}
${DARK('body.paper::before{display:none}')}
.cal [hidden]{display:none!important}
.cal{padding:4px 0 24px;color:var(--ink)}
.cal-hero{display:grid;gap:20px;padding:16px 0 0}
@property --grow{syntax:'<length>';inherits:false;initial-value:0px}
.cal{position:relative}
.ivy{display:none}
.ivy-top{position:absolute;top:-2px;right:-16px;width:min(66vw,330px);height:auto;pointer-events:none;z-index:0;-webkit-mask-image:linear-gradient(to bottom,#000 calc(var(--grow) - 90px),transparent var(--grow));mask-image:linear-gradient(to bottom,#000 calc(var(--grow) - 90px),transparent var(--grow));transition:--grow 1.6s cubic-bezier(.2,.7,.2,1)}
.kicker{margin:0;font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.cal-hero{position:relative}
.more{display:inline-flex;align-items:center;min-height:34px;padding:0 13px;border-radius:999px;border:1px dashed var(--rule);background:transparent;color:var(--accent);font:700 14px/1 inherit;font-family:inherit;cursor:pointer}
.sc:not(.open) li:nth-child(n+11):not(.mli){display:none}
.sc.open .mli{display:none}
.cal h1{margin:10px 0 0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:clamp(64px,8vw,148px);line-height:.92;letter-spacing:-.035em}
.lead{margin:14px 0 0;font-size:clamp(17px,1.2vw,22px);line-height:1.45;color:var(--ink3);max-width:36ch;text-wrap:pretty}
.months{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:28px -16px 0;padding:2px 16px;scroll-padding-inline:16px}
.months::-webkit-scrollbar{display:none}
.mo{position:relative;flex:none;min-height:44px;min-width:58px;padding:0 14px;border-radius:999px;border:1px solid var(--rule);background:var(--chip);color:var(--ink);font:600 15px/1 inherit;font-family:inherit;cursor:pointer}
.mo[aria-selected="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.mo.now::after{content:"";position:absolute;left:50%;bottom:6px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:currentColor}
.kinds{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.kind{min-height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--rule);background:transparent;color:var(--ink);font:600 14px/1 inherit;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.kind[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
${DARK('.kind[aria-pressed="true"]{color:var(--bg)}')}
.kind .dot{width:8px;height:8px}
.dot{display:inline-block;flex:none;width:9px;height:9px;border-radius:50%;background:var(--c,var(--ink2))}
.ico{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:9px;background:var(--tile);font-size:17px;line-height:1}
.ico img{width:86%;height:86%;object-fit:contain}
.sc li .ico,.yr li .ico{width:24px;height:24px;border-radius:7px;font-size:14px;background:transparent}
.show{display:grid;gap:24px;margin-top:36px}
.sc h2{margin:0 0 10px;font-size:14px;font-weight:600;color:var(--ink2)}
.sc ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.sc li{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px 0 5px;border-radius:999px;background:var(--chip);font-size:14px;font-weight:600}
@media (min-width:900px){.sc li{min-height:40px;padding:0 14px 0 6px;font-size:15px;gap:7px}}
.sc .none{font-size:15px;color:var(--ink2)}
.chart{margin-top:44px}
.explain{margin:8px 0 0;max-width:52ch;font-size:15px;line-height:1.45;color:var(--ink3)}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin:12px 0 0;padding:0;list-style:none;font-size:13px;font-weight:600;color:var(--ink2)}
.legend li{display:inline-flex;align-items:center;gap:8px}
.legend .lb{width:26px;height:10px;border-radius:5px;background:linear-gradient(90deg,var(--c-Fruit) 0 33%,var(--c-Vegetables) 33% 66%,var(--c-Fish) 66%)}
.legend .lband{width:14px;height:18px;border-radius:4px;background:var(--band)}
.chart > h2{margin:0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:clamp(28px,2.6vw,48px);letter-spacing:-.02em}
.grid-h,.sr{display:grid;grid-template-columns:var(--namew) repeat(12,minmax(0,1fr))}
.grid-h{position:sticky;top:60px;z-index:2;margin-top:16px;padding:8px 0;background:var(--paper);border-bottom:1px solid var(--rule)}
${DARK('.grid-h{background:var(--bg)}')}
.grid-h span{display:grid;place-items:center;min-height:24px;font-size:12px;font-weight:600;color:var(--ink2);border-radius:6px}
.grid-h span.sel{background:var(--band);color:var(--accent)}
.grid-h .l{display:none}
.grp{margin-top:26px}
.grp > h3{display:flex;align-items:center;gap:10px;margin:0 0 6px;font-size:clamp(18px,1.3vw,22px);font-weight:700}
.grp > h3 .n{font-size:14px;font-weight:600;color:var(--ink2)}
.grp[data-k="Fruit"]{--c:var(--c-Fruit)}.grp[data-k="Vegetables"]{--c:var(--c-Vegetables)}.grp[data-k="Fish"]{--c:var(--c-Fish)}
.sr{min-height:46px;border-top:1px solid var(--rule)}
.sr .nm{display:flex;align-items:center;gap:10px;padding:6px 10px 6px 0;min-width:0}
.sr .tx{display:flex;flex-direction:column;min-width:0}
.sr .nm b{font-size:clamp(14px,1vw,17px);font-weight:600;line-height:1.2}
.flag{margin-top:3px;font-size:11px;font-weight:700;letter-spacing:.01em;color:var(--accent)}
.sr i{display:flex;align-items:center;box-shadow:inset 1px 0 0 var(--gridline)}
.sr i.sel{background:var(--band)}
.sr i b{display:block;width:100%;height:12px}
.sr i.on b{background:var(--c)}
.sr i.on.s b{border-radius:6px 0 0 6px;margin-left:3px}
.sr i.on.e b{border-radius:0 6px 6px 0;margin-right:3px}
.sr i.on.s.e b{border-radius:6px}
.empty{margin:24px 0 0;color:var(--ink2)}
.yr{margin-top:48px;padding-top:28px;border-top:1px solid var(--rule)}
.yr h2{margin:0;font-size:clamp(18px,1.3vw,22px);font-weight:700}
.yr p{margin:6px 0 14px;color:var(--ink2);font-size:15px}
.yr ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.yr li{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 13px 0 5px;border-radius:999px;background:var(--chip);font-size:14px;font-weight:600}
.yr li[data-k="Fruit"]{--c:var(--c-Fruit)}.yr li[data-k="Vegetables"]{--c:var(--c-Vegetables)}.yr li[data-k="Fish"]{--c:var(--c-Fish)}
@media (min-width:900px){
  .cal{--namew:clamp(200px,16vw,280px)}
  .cal{--ivy-w:clamp(150px,12vw,250px);padding-right:max(0px,calc(var(--ivy-w) - (50vw - 50%) + 28px))}
  .ivy{display:block;position:absolute;top:0;bottom:-110px;right:calc(50% - 50vw);width:var(--ivy-w);background:url(/img/sarmasik-dikey.webp) right top/100% auto repeat-y;pointer-events:none;z-index:0;-webkit-mask-image:linear-gradient(to bottom,#000 calc(var(--grow) - 260px),transparent var(--grow)),linear-gradient(to top,transparent 0,#000 320px);-webkit-mask-composite:source-in;mask-image:linear-gradient(to bottom,#000 calc(var(--grow) - 260px),transparent var(--grow)),linear-gradient(to top,transparent 0,#000 320px);mask-composite:intersect;transition:--grow 1.2s cubic-bezier(.2,.7,.2,1)}
  .ivy-top{top:0;right:calc(50% - 50vw + var(--ivy-w) * .5);width:clamp(420px,38vw,760px)}
  .cal-hero,.months,.kinds,.show,.chart,.yr{position:relative;z-index:1}
  .cal-hero{grid-template-columns:minmax(0,5fr) minmax(0,6fr);align-items:center;gap:clamp(24px,3vw,72px);padding-top:clamp(16px,4vh,64px)}
  .cal-hero.solo{grid-template-columns:1fr}
  .months{margin:40px 0 0;padding:2px 0;flex-wrap:wrap;overflow:visible}
  .mo{min-width:64px;font-size:16px}
  .show{grid-template-columns:1fr 1fr;gap:clamp(24px,3vw,56px);margin-top:44px}
  .chart{margin-top:64px}
  .grid-h .l{display:inline}.grid-h .s1{display:none}
  .grid-h span{font-size:13px}
  .sr{min-height:54px}
  .grid-h{top:72px}
  .sr .nm{gap:12px}
  .ico{width:34px;height:34px;font-size:19px}
  .explain{font-size:16px}
  .sr i b{height:14px}
}
@media (max-width:899px){.cal-hero{padding-top:92px}.cal h1{font-size:68px;margin-top:12px}.lead{margin-top:12px}.months{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:36px 0 0;padding:0;overflow:visible}.mo{min-width:0;padding:0;font-size:14px}.kinds{margin-top:16px}.show{margin-top:48px;gap:36px}.chart{margin-top:72px}.yr{margin-top:64px}.grid-h .l{display:none}.sr .ico{width:26px;height:26px;font-size:15px;border-radius:8px}.sr .nm{gap:8px}}
@media (hover:hover){.sr:hover{background:var(--chip)}}
`;

const CLIENT = `
(function(){
  var D = JSON.parse(document.getElementById('cal-data').textContent);
  var month = D.month, kind = D.kind;
  var rows = [].slice.call(document.querySelectorAll('.sr')), groups = [].slice.call(document.querySelectorAll('.grp'));
  var tabs = [].slice.call(document.querySelectorAll('.mo')), kinds = [].slice.call(document.querySelectorAll('.kind'));
  var heads = [].slice.call(document.querySelectorAll('.grid-h span[data-m]'));
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function pills(list, none){
    if (!list.length) return '<p class="none">' + esc(none) + '</p>';
    return '<ul>' + list.map(function(x){ return '<li>' + x.i + esc(x.n) + '</li>'; }).join('') +
      (list.length > 10 ? '<li class="mli"><button type="button" class="more">' + esc(D.t.more.replace('{n}', list.length - 10)) + '</button></li>' : '') + '</ul>';
  }
  document.querySelector('.show').addEventListener('click', function(e){ var b = e.target.closest('.more'); if (!b) return; b.closest('.sc').classList.add('open'); });
  function apply(push){
    var total = 0;
    tabs.forEach(function(b){ b.setAttribute('aria-selected', +b.getAttribute('data-m') === month ? 'true' : 'false'); });
    kinds.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-k') === kind ? 'true' : 'false'); });
    heads.forEach(function(h){ h.classList.toggle('sel', +h.getAttribute('data-m') === month); });
    groups.forEach(function(g){
      var gk = g.getAttribute('data-k'), shown = 0;
      g.querySelectorAll('.sr').forEach(function(r){
        var ms = r.getAttribute('data-m').split(',').map(Number);
        var on = ms.indexOf(month) >= 0 && (kind === 'all' || kind === gk);
        r.hidden = !on;
        if (!on) return;
        shown++;
        var st = r.getAttribute('data-s').split(',').map(Number), en = r.getAttribute('data-e').split(',').map(Number);
        var f = r.querySelector('.flag');
        if (st.indexOf(month) >= 0) { f.textContent = D.t.fresh; f.hidden = false; }
        else if (en.indexOf(month) >= 0) { f.textContent = D.t.last; f.hidden = false; }
        else f.hidden = true;
        r.querySelectorAll('i').forEach(function(c, i){ c.classList.toggle('sel', i + 1 === month); });
      });
      g.hidden = shown === 0;
      g.querySelector('.n').textContent = shown;
      total += shown;
    });
    var items = D.items.filter(function(x){ return kind === 'all' || x.c === kind; });
    document.querySelectorAll('.sc').forEach(function(x){ x.classList.remove('open'); });
    $('sc-start').innerHTML = pills(items.filter(function(x){ return x.s.indexOf(month) >= 0; }), D.t.noneStart);
    $('sc-end').innerHTML = pills(items.filter(function(x){ return x.e.indexOf(month) >= 0; }), D.t.noneEnd);
    $('mname').textContent = D.t.months[month - 1];
    $('count').textContent = D.t.count[month - 1].replace('{n}', total);
    $('empty').hidden = total > 0;
    if (push) {
      var u = new URL(location.href);
      u.searchParams.set('ay', month);
      if (kind === 'all') u.searchParams.delete('tur'); else u.searchParams.set('tur', kind);
      history.replaceState(null, '', u.pathname + u.search);
    }
  }
  tabs.forEach(function(b){ b.addEventListener('click', function(){ month = +b.getAttribute('data-m'); apply(true); }); });
  kinds.forEach(function(b){ b.addEventListener('click', function(){ kind = b.getAttribute('data-k'); apply(true); }); });
  (function(){
    var iv = document.querySelector('.ivy'), it = document.querySelector('.ivy-top'), far = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { [iv, it].forEach(function(e){ if (e) e.style.setProperty('--grow', '100000px'); }); return; }
    function u(){ if (!iv) return; var g = window.scrollY + window.innerHeight * 1.05 - (iv.getBoundingClientRect().top + window.scrollY); if (g > far) { far = g; iv.style.setProperty('--grow', g + 'px'); } }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ u(); if (it) it.style.setProperty('--grow', '700px'); }); });
    addEventListener('scroll', function(){ requestAnimationFrame(u); }, { passive: true });
    addEventListener('resize', function(){ requestAnimationFrame(u); });
  })();
  var sel = document.querySelector('.mo[aria-selected="true"]');
  if (sel && sel.scrollIntoView && window.innerWidth < 900) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
})();
`;

function cells(months, sel) {
  const set = new Set(months);
  const prev = (m) => (m === 1 ? 12 : m - 1), next = (m) => (m === 12 ? 1 : m + 1);
  let h = '';
  for (let m = 1; m <= 12; m++) {
    const on = set.has(m);
    const cls = [on ? 'on' : '', on && !set.has(prev(m)) ? 's' : '', on && !set.has(next(m)) ? 'e' : '', m === sel ? 'sel' : ''].filter(Boolean).join(' ');
    h += '<i' + (cls ? ' class="' + cls + '"' : '') + '><b></b></i>';
  }
  return h;
}

function render(lang, host, q) {
  const t = T[lang];
  q = q || {};
  const now = istanbulMonth();
  const month = +q.ay >= 1 && +q.ay <= 12 ? +q.ay : now;
  const kind = GROUPS.includes(q.tur) ? q.tur : 'all';
  const data = build(lang);
  const inKind = (c) => kind === 'all' || kind === c;
  const visible = data.seasonal.filter((x) => x.months.includes(month) && inKind(x.cat));
  const countTxt = t.months.map((_, i) => t.count(t.inMonth[i], '{n}'));
  const tabs = t.short.map((s, i) =>
    '<button type="button" class="mo' + (i + 1 === now ? ' now' : '') + '" role="tab" data-m="' + (i + 1) + '" aria-selected="' + (i + 1 === month) + '" aria-label="' + esc(t.months[i]) + (i + 1 === now ? ' (' + esc(t.thisMonth) + ')' : '') + '">' + esc(s) + '</button>').join('');
  const kinds = [['all', t.all]].concat(GROUPS.map((g) => [g, t.group[g]])).map(([k, label]) =>
    '<button type="button" class="kind" data-k="' + k + '" aria-pressed="' + (k === kind) + '"' + (k !== 'all' ? ' style="--c:var(--c-' + k + ')"' : '') + '>' +
    (k !== 'all' ? '<span class="dot"></span>' : '') + esc(label) + '</button>').join('');
  const pill = (x) => '<li>' + icon(x.id, x.emoji) + esc(x.name) + '</li>';
  const pills = (list, none) => list.length ? '<ul>' + list.map(pill).join('') + (list.length > 10 ? '<li class="mli"><button type="button" class="more">' + esc(t.more.replace('{n}', list.length - 10)) + '</button></li>' : '') + '</ul>' : '<p class="none">' + esc(none) + '</p>';
  const starting = visible.filter((x) => x.starts.includes(month)), ending = visible.filter((x) => x.ends.includes(month));
  const groups = GROUPS.map((g) => {
    const items = data.seasonal.filter((x) => x.cat === g);
    const shown = items.filter((x) => x.months.includes(month) && inKind(g)).length;
    return '<div class="grp" data-k="' + g + '"' + (shown ? '' : ' hidden') + '><h3><span class="dot" style="--c:var(--c-' + g + ')"></span>' + esc(t.group[g]) + ' <span class="n">' + shown + '</span></h3>' +
      items.map((x) => {
        const on = x.months.includes(month) && inKind(g);
        const flag = x.starts.includes(month) ? t.fresh : x.ends.includes(month) ? t.last : '';
        return '<div class="sr" data-m="' + x.months.join(',') + '" data-s="' + x.starts.join(',') + '" data-e="' + x.ends.join(',') + '"' + (on ? '' : ' hidden') +
          ' aria-label="' + esc(x.name + ': ' + x.label) + '"><span class="nm">' + icon(x.id, x.emoji) + '<span class="tx"><b>' + esc(x.name) + '</b><span class="flag"' + (flag ? '' : ' hidden') + '>' + esc(flag) + '</span></span></span>' + cells(x.months, month) + '</div>';
      }).join('') + '</div>';
  }).join('');
  const head = '<div class="grid-h" aria-hidden="true"><span></span>' + t.short.map((s, i) =>
    '<span data-m="' + (i + 1) + '"' + (i + 1 === month ? ' class="sel"' : '') + '><span class="l">' + esc(s) + '</span><span class="s1">' + esc(s.charAt(0)) + '</span></span>').join('') + '</div>';
  const payload = {
    month, kind,
    t: { fresh: t.fresh, last: t.last, noneStart: t.noneStart, noneEnd: t.noneEnd, months: t.months, count: countTxt, more: t.more },
    items: data.seasonal.map((x) => ({ n: x.name, c: x.cat, s: x.starts, e: x.ends, i: icon(x.id, x.emoji) })),
  };
  const body = '<div class="wrap">' + site.header(lang, '/mevsim?lang=' + (lang === 'tr' ? 'en' : 'tr'), 'season') +
    '<main class="cal"><div class="ivy" aria-hidden="true"></div><img class="ivy-top" src="/img/sarmasik-sarkan.webp" width="1100" height="700" alt="" aria-hidden="true">' +
    '<section class="cal-hero solo"><div style="position:relative;z-index:1"><p class="kicker">' + esc(t.title) + '</p>' +
    '<h1 id="mname">' + esc(t.months[month - 1]) + '</h1>' +
    '<p class="lead" id="count">' + esc(countTxt[month - 1].replace('{n}', visible.length)) + '</p></div></section>' +
    '<nav class="months" role="tablist" aria-label="' + esc(t.monthsLabel) + '">' + tabs + '</nav>' +
    '<div class="kinds" role="group" aria-label="' + esc(t.filterLabel) + '">' + kinds + '</div>' +
    '<section class="show"><div class="sc"><h2>' + esc(t.starting) + '</h2><div id="sc-start">' + pills(starting, t.noneStart) + '</div></div>' +
    '<div class="sc"><h2>' + esc(t.ending) + '</h2><div id="sc-end">' + pills(ending, t.noneEnd) + '</div></div></section>' +
    '<section class="chart" aria-label="' + esc(t.chart) + '"><h2>' + esc(t.chart) + '</h2><p class="explain">' + esc(t.explain) + '</p>' +
    '<ul class="legend" aria-hidden="true"><li><span class="lb"></span>' + esc(t.legendOn) + '</li><li><span class="lband"></span>' + esc(t.legendSel) + '</li></ul>' + head + groups +
    '<p class="empty" id="empty"' + (visible.length ? ' hidden' : '') + '>—</p></section>' +
    '<section class="yr"><h2>' + esc(t.yearRound) + '</h2><p>' + esc(t.yearRoundNote) + '</p><ul>' +
    data.yearRound.map((x) => '<li>' + icon(x.id, x.emoji) + esc(x.name) + '</li>').join('') + '</ul></section>' +
    '</main>' + site.footer(lang, '') + '</div>' +
    '<script type="application/json" id="cal-data">' + JSON.stringify(payload).replace(/</g, '\\u003c') + '</script>' +
    '<script>' + CLIENT + '</script>';
  return site.pageShell({ lang, title: t.title + ' · List-em', description: t.metaDesc, ogTitle: t.title, ogDescription: t.metaDesc, host, css: CSS, body, bodyClass: 'paper', index: true });
}

module.exports = (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(lang, req.headers.host || 'list-em.app', req.query));
};
module.exports.render = render;
