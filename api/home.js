'use strict';
/*
 * Ana sayfa (list-em.app) — ilk ekran ve bu ayın mevsim şeridi.
 * Açılış "listeden pazara": uygulamanın liste kartına satırlar tek tek düşer, her satırla o
 * ürünün çizimi kartın yanındaki tezgâha konar, sonunda ilk ürün işaretlenir. Yaklaşık 2,6 sn;
 * dışarıdan gelen her ziyarette ve yenilemede, sahne ekrana girince oynar; site içinde dolaşırken oynamaz; dokunuş/kaydırma/tuşla anında son hâline geçer, "hareketi azalt"
 * açıksa ve betik yoksa doğrudan son hâli görünür. Yalnız transform ve opacity oynar.
 * Görsel dil: mevsim afişi (düz çizim, risograf dokusu, krem kâğıt). Şimdilik ekim.
 */
const site = require('./_site');
const catalog = require('../public/data/catalog.json');
const { esc } = site;

const T = {
  tr: {
    eyebrow: 'Çok yakında App Store’da',
    title: 'Türkiye’ye özel market alışveriş listesi',
    body: 'Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilen; markette reyon sırasına dizilen; uygulaması olmayanın da açabildiği bir alışveriş listesi.',
    follow: 'Lansmanı kaçırma:', ig: 'Instagram’da List-em', x: 'X’te List-em',
    inSeason: ['Ocak’ta', 'Şubat’ta', 'Mart’ta', 'Nisan’da', 'Mayıs’ta', 'Haziran’da', 'Temmuz’da', 'Ağustos’ta', 'Eylül’de', 'Ekim’de', 'Kasım’da', 'Aralık’ta'].map((m) => m + ' mevsiminde'),
    all: 'Takvimin tamamı',
    list: 'Ekim pazarı', season: 'Mevsiminde', search: 'Hızlı Ara & Ekle...', fruit: 'Meyve', fish: 'Balık & Deniz Ürünleri',
    done: (n) => 'Tamamlananlar (' + n + ')', clear: 'Temizle', add: 'Ürün Ekle', left: (n) => n + ' Kaldı', progress: (a, b) => a + ' / ' + b + ' tamamlandı',
    stage: 'Uygulamada Ekim pazarı listesi: Satsuma mandalina, Trabzon hurması, ayva, Hicaz nar ve hamsi; nar işaretlenmiş. Yanında bu ürünlerden kurulmuş bir pazar tezgâhı çizimi.',
    meta: 'List-em: Türkiye’ye özel market alışveriş listesi. Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilir. Çok yakında App Store’da.',
  },
  en: {
    eyebrow: 'Coming soon to the App Store',
    title: 'A grocery list made for Türkiye',
    body: 'It knows products by weight, calories and season; it puts your list in aisle order; and anyone can open a shared list without the app.',
    follow: 'Don’t miss the launch:', ig: 'List-em on Instagram', x: 'List-em on X',
    inSeason: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => 'In season in ' + m),
    all: 'The whole calendar',
    list: 'October market', season: 'In season', search: 'Quick search & add...', fruit: 'Fruit', fish: 'Fish & Seafood',
    done: (n) => 'Completed (' + n + ')', clear: 'Clear', add: 'Add item', left: (n) => n + ' left', progress: (a, b) => a + ' / ' + b + ' done',
    stage: 'The October market list in the app: satsuma tangerines, persimmons, quinces, Hicaz pomegranates and anchovies, with the pomegranates ticked; beside it, a market stall drawn from them.',
    meta: 'List-em: a grocery list made for Türkiye. It knows products by weight, calories and season. Coming soon to the App Store.',
  },
};

const byId = new Map(catalog.products.map((p) => [p.id, p]));
function kcal1kg(p) {
  const s = (p.sizes || []).find((z) => z.grams === 1000) || (p.sizes || [])[0];
  return s ? Math.round(s.kcal * (1000 / s.grams)) : null;
}

/* Uygulamanın liste ekranı, birebir: satırlar uygulamadaki sırada ve değerlerle (Ekim 2026
   ekran görüntüleri). Tek fark ürün ikonları: emoji yerine bizim çizimlerimiz.
   x/y/w: masaüstü sahnesinde parçanın yeri (yüzde); mx/my/mw: telefonda. r: dönüş, f: -1 aynalı. */
const ROWS = [
  { icon: 'mandalina', tr: 'Satsuma Mandalina', en: 'Satsuma Tangerine', qty: '1kg', kcal: 470, variants: true, pieces: [
    { img: 'mandalina', x: 80, y: 58, w: 21, r: -4, z: 3, mx: 56, my: 38, mw: 23 },
    { img: 'mandalina', x: 45, y: 66, w: 17, r: 12, z: 2, f: -1, mx: 4, my: 44, mw: 21 }] },
  { icon: 'hurma', tr: 'Trabzon hurması', en: 'Persimmon', qty: '500g', kcal: 350, pieces: [
    { img: 'hurma', x: 53, y: 46, w: 21, r: -6, z: 3, mx: 74, my: 18, mw: 22 },
    { img: 'hurma', x: 69, y: 52, w: 19, r: 11, z: 4, mx: 38, my: 34, mw: 19 }] },
  { icon: 'ayva', tr: 'Ayva', en: 'Quince', qty: '500g', kcal: 285, pieces: [
    { img: 'ayva', x: 77, y: 31, w: 23, r: 8, z: 2, mx: 42, my: 0, mw: 22 },
    { img: 'ayva', x: 57, y: 27, w: 19, r: -14, z: 1, f: -1, mx: 60, my: 10, mw: 19 }] },
  { icon: 'nar', tr: 'Hicaz Nar', en: 'Hicaz Pomegranate', qty: '1kg', kcal: 830, variants: true, ticked: true, pieces: [
    { img: 'nar', x: 49, y: 1, w: 25, r: -8, z: 2, mx: 1, my: 6, mw: 25 },
    { img: 'nar-yarim', x: 66, y: 9, w: 25, r: 7, z: 3, mx: 21, my: 14, mw: 24 }] },
  { icon: 'hamsi', tr: 'Hamsi', en: 'Anchovy', qty: '500g', kcal: 655, fish: true, pieces: [
    { img: 'hamsi-uc', x: 51, y: 75, w: 31, r: -4, z: 5, mx: 66, my: 58, mw: 32 },
    { img: 'hamsi', x: 75, y: 85, w: 22, r: 6, z: 5, mx: 24, my: 66, mw: 26 }] },
];
const LEAVES = [
  { img: 'yaprak', x: 91, y: 4, w: 13, r: 22, z: 1, mx: 87, my: 2, mw: 13 },
  { img: 'yaprak', x: 40, y: 0, w: 12, r: -32, z: 1, f: -1, mx: 0, my: 0, mw: 12 },
  { img: 'yaprak', x: 88, y: 79, w: 12, r: 112, z: 1, mx: 88, my: 50, mw: 12 },
];
const ROW_START = 420, ROW_STEP = 340, TAP_AT = 2750, CHECK_AT = 3000, MOVE_AT = 4200;
const AT = ROWS.map((_, i) => ROW_START + i * ROW_STEP);

const SV = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5l9 4.5 9-4.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

function piece(p, delay) {
  return '<img class="pc" src="/img/pazar/' + p.img + '.webp" alt="" style="--x:' + p.x + '%;--y:' + p.y + '%;--w:' + p.w +
    '%;--mx:' + p.mx + '%;--my:' + p.my + '%;--mw:' + p.mw + '%;--r:' + p.r + 'deg;--f:' + (p.f || 1) + ';--d:' + delay + 'ms;z-index:' + p.z + '">';
}

function appRow(row, lang, t, opts) {
  const name = lang === 'en' ? row.en : row.tr;
  return '<li class="ap-row' + (opts.cls ? ' ' + opts.cls : '') + '"' + (opts.d != null ? ' style="--d:' + opts.d + 'ms"' : '') + '>' +
    '<span class="ap-chk">' + SV.check + '</span>' +
    '<span class="ap-ico"><img src="/img/pazar/' + row.icon + '.webp" alt=""></span>' +
    '<span class="ap-txt"><span class="ap-l1"><b class="ap-nm">' + esc(name) + '</b>' +
    (opts.done ? '' : '<span class="ap-season' + (row.fish ? ' fish' : '') + '"><span aria-hidden="true">' + (row.fish ? '🐟' : '🌿') + '</span>' + esc(t.season) + '</span>') +
    '</span><span class="ap-mt">' + row.qty + ' · ~' + row.kcal + ' kcal</span></span>' +
    '<span class="ap-end">' + (row.variants ? SV.layers : '') + SV.chev + '</span></li>';
}

function stage(lang) {
  const t = T[lang];
  let pcs = '';
  ROWS.forEach((row, i) => row.pieces.forEach((pp, j) => { pcs += piece(pp, AT[i] + 140 + j * 90); }));
  LEAVES.forEach((l) => { pcs += piece(l, AT[AT.length - 1] + ROW_STEP); });
  const fruit = ROWS.filter((r) => !r.fish), fish = ROWS.filter((r) => r.fish);
  const ticked = ROWS.find((r) => r.ticked);
  const fruitRows = fruit.map((r) => appRow(r, lang, t, { d: AT[ROWS.indexOf(r)], cls: r.ticked ? 'tick' : '' })).join('');
  const fishRows = fish.map((r) => appRow(r, lang, t, { d: AT[ROWS.indexOf(r)] })).join('');
  const app = '<div class="app" aria-hidden="true">' +
    '<div class="ap-head"><span class="ap-back">' + SV.back + '</span>' +
    '<span class="ap-tile"><span class="ap-emo">🧺</span><span class="ap-badge"><span class="ap-n">' + (ROWS.length - 1) + '</span></span></span>' +
    '<span class="ap-title">' + esc(t.list) + '</span>' +
    '<span class="ap-tools"><span class="ap-lang">' + (lang === 'en' ? 'EN' : 'TR') + '</span>' + SV.sun + SV.gear + '</span></div>' +
    '<div class="ap-search"><span class="ap-field">' + SV.search + '<span>' + esc(t.search) + '</span></span></div>' +
    '<div class="ap-body">' +
    '<div class="ap-sec" style="--d:' + AT[0] + 'ms"><span aria-hidden="true">🍎</span>' + esc(t.fruit) + '</div><ul class="ap-rows">' + fruitRows + '</ul>' +
    '<div class="ap-sec" style="--d:' + AT[ROWS.indexOf(fish[0])] + 'ms"><span aria-hidden="true">🐟</span>' + esc(t.fish) + '</div><ul class="ap-rows">' + fishRows + '</ul>' +
    '<div class="ap-sec ap-donehead"><span class="ap-donet">' + esc(t.done(1)) + '</span><span class="ap-clear">' + esc(t.clear) + '</span>' + SV.down + '</div>' +
    '<ul class="ap-rows ap-done">' + appRow(ticked, lang, t, { cls: 'done', done: true }) + '</ul>' +
    '</div>' +
    '<div class="ap-foot"><span class="ap-left">' + esc(t.progress(1, ROWS.length)) + '</span><span class="ap-add">' + SV.plus + esc(t.add) + '</span></div></div>';
  return '<div class="stage" role="img" aria-label="' + esc(t.stage) + '" style="--tap:' + TAP_AT + 'ms;--check:' + CHECK_AT + 'ms;--move:' + MOVE_AT + 'ms"' +
    ' data-at="' + AT.join(',') + '" data-check="' + CHECK_AT + '" data-left="' + esc(t.left('{n}')) + '" data-progress="' + esc(t.progress(1, ROWS.length)) + '">' +
    '<div class="pile" aria-hidden="true">' + pcs + '</div>' + app + '</div>';
}

/* Bu ayın mevsimindekiler: tezgâhtaki ürünler önce, ay değişince katalog ne diyorsa o. */
const FEATURED = ['nar', 'ayva', 'trabzon-hurmasi', 'mandalina', 'hamsi'];
function inSeasonNow(month) {
  const ok = (p) => p.season && !p.season.yearRound && p.season.months.includes(month) && ['Fruit', 'Vegetables', 'Fish'].includes(p.category);
  const first = FEATURED.map((id) => byId.get(id)).filter((p) => p && ok(p));
  const rest = catalog.products.filter((p) => ok(p) && !FEATURED.includes(p.id));
  return first.concat(rest).slice(0, 5);
}
const PIECE = { nar: 'nar', ayva: 'ayva', 'trabzon-hurmasi': 'hurma', mandalina: 'mandalina', hamsi: 'hamsi-uc' };
const MONTHS = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
/* Bu ayı içeren kesintisiz mevsim aralığı: "Eylül – Aralık", "Ekim – Şubat". */
function range(months, month, lang) {
  const has = (m) => months.includes(((m - 1 + 12) % 12) + 1);
  let a = month, b = month, n = 0;
  while (has(a - 1) && n++ < 11) a = ((a - 2 + 12) % 12) + 1;
  n = 0;
  while (has(b + 1) && n++ < 11) b = (b % 12) + 1;
  return a === b ? MONTHS[lang][a - 1] : MONTHS[lang][a - 1] + ' – ' + MONTHS[lang][b - 1];
}
function nowSection(lang, month, q) {
  const t = T[lang];
  const items = inSeasonNow(month);
  if (!items.length) return '';
  const href = '/mevsim' + (q ? q + '&' : '?') + 'ay=' + month;
  return '<section class="now" aria-labelledby="now-h"><div class="now-head"><h2 id="now-h">' + esc(t.inSeason[month - 1]) + '</h2>' +
    '<a class="all" href="/mevsim' + q + '">' + esc(t.all) + ' →</a></div><ul class="now-list">' +
    items.map((p) => '<li><a href="' + href + '"><span class="pic">' +
      (PIECE[p.id] ? '<img src="/img/pazar/' + PIECE[p.id] + '.webp" alt="" loading="lazy">' : '<span class="emo" aria-hidden="true">' + esc(p.emoji) + '</span>') +
      '</span><span class="nm">' + esc(lang === 'en' ? p.nameEn : p.nameTr) + '</span><span class="rng">' + esc(range(p.season.months, month, lang)) + '</span></a></li>').join('') +
    '</ul></section>';
}
function istanbulMonth() {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', month: 'numeric' }).format(new Date())); }
  catch (e) { return new Date().getMonth() + 1; }
}

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .12 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const DARK = (sel) => '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ' + sel + '}\n:root[data-theme="dark"] ' + sel + '\n';

const CSS = `
:root{--paper:#F7E8CE;--paper-ink:#2B2118;--paper-2:#6A5D4E;--paper-body:#4A3F33;--card:#FFFFFF;--card-rule:rgba(43,33,24,.09);--tile:#F4EEE3;--ease-back:cubic-bezier(.34,1.5,.64,1);--ease-out:cubic-bezier(.2,.8,.2,1)}
body.home{background:var(--paper)}
body.home::before{content:"";position:fixed;inset:0;background-image:${GRAIN};opacity:.16;mix-blend-mode:multiply;pointer-events:none;z-index:30}
.hero{display:grid;gap:8px;padding-bottom:8px}
.hero-copy{padding:20px 0 0}
.eyebrow{margin:0;display:inline-flex;align-items:center;min-height:28px;padding:0 12px;border-radius:999px;background:rgba(45,139,117,.12);color:var(--accent);font-size:13px;font-weight:600}
.hero h1{text-wrap:balance;margin:20px 0 0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:40px;line-height:1.03;letter-spacing:-.025em;color:var(--paper-ink)}
.hero p.body{margin:16px 0 0;font-size:17px;line-height:1.5;color:var(--paper-body);max-width:34ch;text-wrap:pretty}
.follow{display:grid;gap:12px;margin-top:32px}
.soc-row{display:flex;flex-wrap:wrap;gap:10px}
.follow-label{font-size:clamp(14px,.95vw,16px);font-weight:600;color:var(--paper-2)}
.soc{display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:0 18px 0 14px;border-radius:999px;border:1px solid rgba(43,33,24,.2);background:rgba(255,255,255,.4);color:var(--paper-ink);font-size:clamp(15px,1vw,18px);font-weight:600;text-decoration:none}
.soc svg{width:20px;height:20px;flex:none}
.soc:active{opacity:.6}
@media (hover:hover){.soc:hover{background:rgba(255,255,255,.7)}}
.home .site-foot{border-top-color:rgba(43,33,24,.14)}
.now{margin-top:56px;padding-top:28px;border-top:1px solid rgba(43,33,24,.14)}
.now-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px 16px;flex-wrap:wrap}
.now h2{margin:0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:clamp(28px,2.6vw,48px);letter-spacing:-.02em;line-height:1.05;color:var(--paper-ink)}
.now .all{display:inline-flex;align-items:center;min-height:44px;color:var(--accent);font-weight:600;text-decoration:none;font-size:clamp(15px,1vw,18px)}
.now-list{list-style:none;margin:20px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 10px}
.now-list a{display:flex;flex-direction:column;text-decoration:none;color:var(--paper-ink)}
.now-list .pic{display:grid;place-items:center;aspect-ratio:1;border-radius:20px;background:rgba(255,255,255,.45)}
.now-list img{width:72%;height:72%;object-fit:contain}
.now-list .emo{font-size:52px}
.now-list .nm{margin-top:8px;font-size:clamp(15px,1.1vw,20px);font-weight:600;line-height:1.2}
.now-list .rng{margin-top:3px;font-size:clamp(12.5px,.9vw,16px);color:var(--paper-2)}
@media (hover:hover){.now-list a:hover .pic{background:rgba(255,255,255,.75)}}

/* sahne: telefonda önce tezgâh, altında uygulama; masaüstünde uygulama solda, tezgâh sağda */
.stage{position:relative;margin:40px 0 0;container-type:inline-size}
.pile{position:relative;aspect-ratio:1.55;margin:0 -4px}
.pc{position:absolute;left:var(--mx);top:var(--my);width:var(--mw);height:auto;transform:rotate(var(--r)) scaleX(var(--f));transform-origin:50% 60%}
/* uygulamanın liste ekranı: ölçüler ekran genişliğine bağlı (24em = kart genişliği) */
.app{--ap-bg:#F6F5F1;--ap-row:#EEEDE8;--ap-sep:#E2E1DC;--ap-tile:#E4E3DE;--ap-text:#1C1C1A;--ap-2:#6F6E69;--ap-ring:#3A3A38;--ap-green:#2D8B75;--ap-mint:#DCEBE4;--ap-sfg:#2A7A5E;--ap-fbg:#DCE6EC;--ap-ffg:#2E6C8A;--ap-field:#FFFFFF;--ap-fieldb:#E3E2DD;
  --tilt:0deg;transform:rotate(var(--tilt));position:relative;z-index:10;margin:-8% 0 0;font-size:calc(100cqw / 24);background:var(--ap-bg);color:var(--ap-text);border-radius:1.6em;overflow:hidden;
  box-shadow:0 1.2em 3em rgba(70,45,20,.18),0 .15em .4em rgba(70,45,20,.08);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",sans-serif}
.app svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block}
.ap-head{display:flex;align-items:center;gap:.5em;height:3.5em;padding:0 .95em 0 .75em}
.ap-back{color:var(--ap-green)}.ap-back svg{width:1.05em;height:1.05em;stroke-width:2.4}
.ap-tile{position:relative;display:grid;place-items:center;width:2.35em;height:2.35em;border-radius:.62em;background:var(--ap-mint)}
.ap-emo{font-size:1.15em;line-height:1}
.ap-badge{position:absolute;top:-.55em;right:-.55em;display:grid;place-items:center;min-width:2em;height:2em;padding:0 .45em;border-radius:999px;background:var(--ap-green);color:#fff;font-size:.5em;font-weight:700;box-shadow:0 0 0 .22em var(--ap-bg)}
.ap-title{font-size:.92em;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.ap-tools{display:flex;align-items:center;gap:1.2em;margin-left:auto;color:var(--ap-text)}
.ap-lang{font-size:.58em;font-weight:700}
.ap-tools svg{width:.95em;height:.95em;stroke-width:1.7}
.ap-search{padding:0 .9em .5em;border-bottom:1px solid var(--ap-sep)}
.ap-field{display:flex;align-items:center;gap:.5em;height:2.15em;padding:0 .8em;border-radius:.75em;background:var(--ap-field);box-shadow:inset 0 0 0 1px var(--ap-fieldb);color:var(--ap-2)}
.ap-field span{font-size:.64em}
.ap-field svg{width:.85em;height:.85em;color:var(--ap-text);stroke-width:2.2}
.ap-body{padding:.75em .9em .2em}
.ap-sec{display:flex;align-items:center;gap:.7em;height:3.7em;padding-top:.5em;font-size:.6em;font-weight:700;color:var(--ap-2)}
.ap-rows{list-style:none;margin:0;padding:0}
.ap-row{display:flex;align-items:center;gap:.7em;height:3.7em;padding:0 .78em;background:var(--ap-row);box-shadow:inset 0 1px 0 var(--ap-sep);overflow:hidden}
.ap-rows .ap-row:first-child{box-shadow:none}
.ap-chk{position:relative;flex:none;display:grid;place-items:center;width:1.3em;height:1.3em;border-radius:50%;box-shadow:inset 0 0 0 .1em var(--ap-ring)}
.ap-chk svg{width:.85em;height:.85em;stroke:#fff;stroke-width:3;stroke-dasharray:22;stroke-dashoffset:22}
.ap-ico{flex:none;display:grid;place-items:center;width:1.95em;height:1.95em;border-radius:.5em;background:var(--ap-tile)}
.ap-ico img{width:84%;height:84%;object-fit:contain}
.ap-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:.28em}
.ap-l1{display:flex;align-items:center;gap:.4em;min-width:0}
.ap-nm{position:relative;font-size:.78em;font-weight:700;letter-spacing:-.012em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap-nm::after{content:"";position:absolute;left:0;right:0;top:54%;height:.1em;background:currentColor;transform:scaleX(0);transform-origin:left}
.ap-season{flex:none;display:inline-flex;align-items:center;gap:.3em;padding:.2em .5em;border-radius:.5em;background:var(--ap-mint);color:var(--ap-sfg);font-size:.52em;font-weight:700;font-style:italic;white-space:nowrap}
.ap-season.fish{background:var(--ap-fbg);color:var(--ap-ffg)}
.ap-mt{font-size:.55em;font-weight:600;color:var(--ap-2)}
.ap-end{flex:none;display:flex;align-items:center;gap:.55em;color:var(--ap-2)}
.ap-end svg{width:.78em;height:.78em;stroke-width:1.6}
.ap-end svg:last-child{width:.82em;height:.82em;stroke-width:2.2}
.ap-donehead{gap:.6em;padding-top:1em;height:4.4em}
.ap-donet{flex:1}
.ap-clear{padding:.3em .95em;border-radius:999px;background:var(--ap-mint);color:var(--ap-green)}
.ap-donehead svg{width:1.5em;height:1.5em;margin-left:.6em}
.ap-row.done .ap-chk,.ap-row.tick .ap-chk{box-shadow:none}
.ap-row.done .ap-chk{background:var(--ap-green)}
.ap-row.done .ap-chk svg{stroke-dashoffset:0}
.ap-row.done .ap-nm{color:var(--ap-2)}
.ap-row.done .ap-nm::after{transform:scaleX(1)}
.ap-row.done .ap-ico{opacity:.5}
.ap-row.tick{display:none}
.ap-foot{display:flex;align-items:center;justify-content:space-between;gap:1em;margin-top:.6em;padding:.7em .9em .85em;box-shadow:inset 0 1px 0 var(--ap-sep)}
.ap-left{font-size:.56em;font-weight:700;color:var(--ap-2);font-variant-numeric:tabular-nums}
.ap-add{display:inline-flex;align-items:center;gap:.5em;height:3.25em;padding:0 1.45em;border-radius:1em;background:var(--ap-green);color:#fff;font-size:.72em;font-weight:700}
.ap-add svg{width:1.15em;height:1.15em;stroke-width:2.4}

/* açılış: satırlar düşer, çizimler tezgâha konar, nar işaretlenip "Tamamlananlar"a iner */
@keyframes pc-in{from{opacity:0;transform:translateY(18px) scale(.55) rotate(calc(var(--r) - 16deg)) scaleX(var(--f))}55%{opacity:1}to{opacity:1;transform:rotate(var(--r)) scaleX(var(--f))}}
@keyframes row-in{from{opacity:0;transform:translateY(-.6em)}to{opacity:1;transform:none}}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
@keyframes card-in{from{opacity:0;transform:translateY(14px) scale(.985) rotate(var(--tilt))}to{opacity:1;transform:rotate(var(--tilt))}}
@keyframes chk-in{from{background:transparent;box-shadow:inset 0 0 0 .11em var(--ap-ring)}to{background:var(--ap-green);box-shadow:inset 0 0 0 .11em var(--ap-green)}}
@keyframes draw{from{stroke-dashoffset:22}to{stroke-dashoffset:0}}
@keyframes strike{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes dim{from{opacity:1}to{opacity:.5}}
@keyframes grey{from{color:var(--ap-text)}to{color:var(--ap-2)}}
@keyframes tap{0%{opacity:0;transform:scale(.3)}25%{opacity:.3}100%{opacity:0;transform:scale(1.2)}}
@keyframes collapse{from{height:3.7em;opacity:1}to{height:0;opacity:0}}
@keyframes expand{from{height:0;opacity:0}to{height:3.7em;opacity:1}}
.stage.play .app{animation:card-in .42s var(--ease-out) both}
.stage.play .pc{animation:pc-in .56s var(--ease-back) both;animation-delay:var(--d)}
.stage.play .ap-row:not(.done),.stage.play .ap-sec:not(.ap-donehead){animation:row-in .36s var(--ease-out) both;animation-delay:var(--d)}
.stage.play .ap-row.tick{display:flex;animation:row-in .36s var(--ease-out) both,collapse .6s var(--ease-out) forwards;animation-delay:var(--d),var(--move)}
.stage.play .ap-row.tick .ap-chk::after{content:"";position:absolute;inset:-.6em;border-radius:50%;background:var(--ap-green);opacity:0;animation:tap .7s ease-out both;animation-delay:var(--tap)}
.stage.play .ap-row.tick .ap-chk{animation:chk-in .35s ease-out both;animation-delay:var(--check)}
.stage.play .ap-row.tick .ap-chk svg{animation:draw .4s var(--ease-out) both;animation-delay:calc(var(--check) + 100ms)}
.stage.play .ap-row.tick .ap-nm::after{animation:strike .45s var(--ease-out) both;animation-delay:calc(var(--check) + 180ms)}
.stage.play .ap-row.tick .ap-nm{animation:grey .45s both;animation-delay:calc(var(--check) + 180ms)}
.stage.play .ap-row.tick .ap-ico{animation:dim .45s both;animation-delay:calc(var(--check) + 180ms)}
.stage.play .ap-donehead{animation:fade-in .5s ease both;animation-delay:var(--move)}
.stage.play .ap-row.done{animation:expand .6s var(--ease-out) both;animation-delay:var(--move)}
.stage.play.wait *{animation-play-state:paused!important}
/* koyu tema: kâğıt gece rengi, kart uygulamanın koyu yüzeyi; parçalar kendi renginde */
${DARK('.home{--paper-ink:var(--text);--paper-2:var(--text2)}')}
${DARK('.app{--ap-bg:#121212;--ap-row:#1E1E1C;--ap-sep:#2A2A28;--ap-tile:#2A2A28;--ap-text:#F2F2EF;--ap-2:#8E8D88;--ap-ring:#7A7975;--ap-green:#3DB394;--ap-mint:#1F3A30;--ap-sfg:#4FC79B;--ap-fbg:#1B3140;--ap-ffg:#5BB3E0;--ap-field:#262624;--ap-fieldb:#262624;box-shadow:0 1.2em 3em rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06)}')}
${DARK('body.home{background:var(--bg)}')}
${DARK('body.home::before{display:none}')}
${DARK('.soc{background:var(--surface);border-color:var(--border);color:var(--text)}')}
${DARK('.home{--paper-body:var(--text2)}')}
${DARK('.now-list .pic{background:var(--surface)}')}
${DARK('.now,.home .site-foot{border-top-color:var(--border)}')}

@media (min-width:900px){
  .hero{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:center;gap:clamp(24px,3vw,72px);padding:clamp(24px,6vh,104px) 0 0}
  .hero-copy{order:1;padding:0}
  .stage{order:2;aspect-ratio:1.08;margin:0}
  .pile{position:absolute;inset:0;aspect-ratio:auto;margin:0}
  .pc{left:var(--x);top:var(--y);width:var(--w)}
  .app{--tilt:-3deg;position:absolute;left:-5%;top:5%;width:50%;margin:0;font-size:calc(50cqw / 24)}
  .hero h1{font-size:clamp(52px,4.2vw,92px);margin-top:24px}
  .hero p.body{font-size:clamp(18px,1.2vw,22px);margin-top:24px;max-width:40ch}
  .follow{margin-top:40px}
  .now{margin-top:clamp(56px,8vh,120px);padding-top:clamp(28px,3vw,48px)}
  .now-list{margin:clamp(20px,2.4vw,40px) 0 0;padding:0;grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(12px,1.6vw,28px);overflow:visible}
  .eyebrow{font-size:clamp(13px,.9vw,16px);min-height:clamp(28px,2vw,36px);padding:0 clamp(12px,.9vw,16px)}
}
@media (min-width:1700px){.hero{grid-template-columns:minmax(0,6fr) minmax(0,7fr)}}
@media (max-width:899px){
  .hero{text-align:center}
  .hero-copy{display:contents}
  .eyebrow{order:0;justify-self:center;margin-top:16px}
  .stage{order:1;margin-top:18px}
  .hero h1{order:2;margin-top:52px;font-size:38px}
  .hero p.body{order:3;margin:16px auto 0}
  .follow{order:4;justify-items:center;margin-top:28px}
  .soc-row{justify-content:center}
  .now{margin-top:72px;padding-top:36px}
  .now h2{font-size:30px}
}
@media (prefers-reduced-motion:reduce){.stage.play *{animation:none!important}}
.stage.play.wait *{animation-play-state:paused!important}
`;

/* Açılış: oturumda bir kez; dokunuş, kaydırma ya da tuşla anında son hâline geçer. */
const INTRO_JS = '(function(){var s=document.querySelector(".stage");if(!s)return;' +
  'var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,inside=false,reload=false;' +
  'try{inside=!!document.referrer&&new URL(document.referrer).host===location.host}catch(e){}' +
  'try{var n=performance.getEntriesByType("navigation")[0];reload=!!n&&n.type==="reload"}catch(e){}' +
  'if(rm||(inside&&!reload))return;' +
  'var at=s.getAttribute("data-at").split(",").map(Number),ck=+s.getAttribute("data-check"),lf=s.getAttribute("data-left"),pg=s.getAttribute("data-progress");' +
  'var bd=s.querySelector(".ap-badge"),bn=s.querySelector(".ap-n"),ft=s.querySelector(".ap-left"),B=bn.textContent,F=ft.textContent,tm=[];' +
  'function put(b,f){bd.style.visibility=b===null?"hidden":"";if(b!==null)bn.textContent=b;ft.textContent=f}' +
  's.classList.add("play","wait");put(null,"");' +
  'function go(){s.classList.remove("wait");' +
  'at.forEach(function(t,i){tm.push(setTimeout(function(){put(String(i+1),lf.replace("{n}",i+1))},t))});' +
  'tm.push(setTimeout(function(){put(String(at.length-1),pg)},ck));' +
  'tm.push(setTimeout(function(){s.classList.remove("play")},ck+2300))}' +
  'if(!("IntersectionObserver" in window))return go();' +
  'var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();go()}},{threshold:.1});io.observe(s)})();';

function render(lang, host) {
  const t = T[lang];
  const q = lang === 'en' ? '?lang=en' : '';
  const month = istanbulMonth();
  const body = '<div class="wrap">' + site.header(lang, '/?lang=' + (lang === 'tr' ? 'en' : 'tr'), null) +
    '<main class="hero">' +
    '<div class="hero-copy">' +
    '<p class="eyebrow">' + esc(t.eyebrow) + '</p>' +
    '<h1>' + esc(t.title) + '</h1>' +
    '<p class="body">' + esc(t.body) + '</p>' +
    '<div class="follow"><span class="follow-label">' + esc(t.follow) + '</span><div class="soc-row">' +
    '<a class="soc" href="https://www.instagram.com/listem.app/" target="_blank" rel="noopener noreferrer" aria-label="' + esc(t.ig) + '">' + site.SOCIAL.instagram + '<span>Instagram</span></a>' +
    '<a class="soc" href="https://x.com/listemapp" target="_blank" rel="noopener noreferrer" aria-label="' + esc(t.x) + '">' + site.SOCIAL.x + '<span>X</span></a></div></div>' +
    '</div>' + stage(lang) + '</main>' + nowSection(lang, month, q) + site.footer(lang, '') + '</div>' +
    '<script>' + INTRO_JS + '</script>';
  return site.pageShell({ lang, title: 'List-em · ' + t.title, description: t.meta, ogTitle: 'List-em', ogDescription: t.meta, host, css: CSS, body, bodyClass: 'home', index: true });
}

module.exports = (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(lang, req.headers.host || 'list-em.app'));
};
module.exports.render = render;
