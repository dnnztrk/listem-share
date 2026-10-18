'use strict';
/*
 * Ana sayfa (list-em.app) — ilk ekran ve bu ayın mevsim şeridi.
 * Açılış "listeden pazara": uygulamanın liste kartına satırlar tek tek düşer, her satırla o
 * ürünün çizimi kartın yanındaki tezgâha konar, sonunda ilk ürün işaretlenir. Yaklaşık 2,6 sn;
 * dışarıdan gelen her ziyarette ve yenilemede oynar, site içinde dolaşırken oynamaz; dokunuş/kaydırma/tuşla anında son hâline geçer, "hareketi azalt"
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
    list: 'Ekim pazarı', items: (n) => n + ' ürün', unit: 'kg', season: 'Mevsiminde',
    stage: 'Uygulamada bir alışveriş listesi: nar, ayva, Trabzon hurması, mandalina ve hamsi; yanında bu ürünlerden kurulmuş bir pazar tezgâhı çizimi.',
    meta: 'List-em: Türkiye’ye özel market alışveriş listesi. Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilir. Çok yakında App Store’da.',
  },
  en: {
    eyebrow: 'Coming soon to the App Store',
    title: 'A grocery list made for Turkey',
    body: 'It knows products by weight, calories and season; it puts your list in aisle order; and anyone can open a shared list without the app.',
    follow: 'Don’t miss the launch:', ig: 'List-em on Instagram', x: 'List-em on X',
    inSeason: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => 'In season in ' + m),
    all: 'The whole calendar',
    list: 'October market', items: (n) => n + ' items', unit: 'kg', season: 'In season',
    stage: 'A shopping list in the app: pomegranates, quinces, persimmons, tangerines and anchovies, next to a drawing of a market stall built from them.',
    meta: 'List-em: a grocery list made for Turkey. It knows products by weight, calories and season. Coming soon to the App Store.',
  },
};

const byId = new Map(catalog.products.map((p) => [p.id, p]));
function kcal1kg(p) {
  const s = (p.sizes || []).find((z) => z.grams === 1000) || (p.sizes || [])[0];
  return s ? Math.round(s.kcal * (1000 / s.grams)) : null;
}

/* Liste satırları ve her satırla tezgâha konan parçalar.
   x/y/w: masaüstü sahnesinde yüzde; mx/my/mw: telefonda. r: dönüş, f: -1 aynalı. */
const ROWS = [
  { id: 'nar', icon: 'nar', pieces: [
    { img: 'nar', x: 46, y: 2, w: 24, r: -8, z: 2, mx: 1, my: 6, mw: 25 },
    { img: 'nar-yarim', x: 63, y: 6, w: 24, r: 7, z: 3, mx: 21, my: 14, mw: 24 }] },
  { id: 'ayva', icon: 'ayva', pieces: [
    { img: 'ayva', x: 80, y: 14, w: 21, r: 8, z: 2, mx: 42, my: 0, mw: 22 },
    { img: 'ayva', x: 54, y: 30, w: 18, r: -14, z: 1, f: -1, mx: 60, my: 10, mw: 19 }] },
  { id: 'trabzon-hurmasi', icon: 'hurma', pieces: [
    { img: 'hurma', x: 70, y: 34, w: 21, r: -6, z: 3, mx: 74, my: 18, mw: 22 },
    { img: 'hurma', x: 86, y: 46, w: 17, r: 11, z: 4, mx: 38, my: 34, mw: 19 }] },
  { id: 'mandalina', icon: 'mandalina', pieces: [
    { img: 'mandalina', x: 56, y: 55, w: 20, r: -4, z: 3, mx: 56, my: 38, mw: 23 },
    { img: 'mandalina', x: 76, y: 60, w: 18, r: 12, z: 2, f: -1, mx: 4, my: 44, mw: 21 }] },
  { id: 'hamsi', icon: 'hamsi', pieces: [
    { img: 'hamsi-uc', x: 40, y: 76, w: 30, r: -4, z: 5, mx: 66, my: 58, mw: 32 },
    { img: 'hamsi', x: 70, y: 82, w: 22, r: 6, z: 5, mx: 24, my: 66, mw: 26 }] },
];
const LEAVES = [
  { img: 'yaprak', x: 93, y: 0, w: 11, r: 22, z: 1, mx: 87, my: 2, mw: 13 },
  { img: 'yaprak', x: 35, y: 2, w: 11, r: -32, z: 1, f: -1, mx: 0, my: 0, mw: 12 },
  { img: 'yaprak', x: 90, y: 72, w: 11, r: 112, z: 1, mx: 88, my: 50, mw: 12 },
];
const ROW_STEP = 330, ROW_START = 380, CHECK_AT = 2350;

function piece(p, delay) {
  return '<img class="pc" src="/img/pazar/' + p.img + '.webp" alt="" style="--x:' + p.x + '%;--y:' + p.y + '%;--w:' + p.w +
    '%;--mx:' + p.mx + '%;--my:' + p.my + '%;--mw:' + p.mw + '%;--r:' + p.r + 'deg;--f:' + (p.f || 1) + ';--d:' + delay + 'ms;z-index:' + p.z + '">';
}

function stage(lang) {
  const t = T[lang];
  const fmt = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'tr-TR');
  let pcs = '', rows = '';
  ROWS.forEach((row, i) => {
    const p = byId.get(row.id);
    const at = ROW_START + i * ROW_STEP;
    row.pieces.forEach((pp, j) => { pcs += piece(pp, at + 140 + j * 90); });
    const k = kcal1kg(p);
    rows += '<li class="ac-row' + (i === 0 ? ' first' : '') + '" style="--d:' + at + 'ms">' +
      '<span class="chk"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg></span>' +
      '<span class="tile"><img src="/img/pazar/' + row.icon + '.webp" alt=""></span>' +
      '<span class="txt"><span class="nm">' + esc(lang === 'en' ? p.nameEn : p.nameTr) + '</span>' +
      '<span class="mt">1 ' + t.unit + (k ? ' · ~' + fmt.format(k) + ' kcal' : '') + '</span></span>' +
      '<span class="leaf" title="' + esc(t.season) + '"><svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zm0 0l7-7"/></svg></span></li>';
  });
  LEAVES.forEach((l) => { pcs += piece(l, ROW_START + ROWS.length * ROW_STEP); });
  return '<div class="stage" role="img" aria-label="' + esc(t.stage) + '" style="--check:' + CHECK_AT + 'ms">' +
    '<div class="pile" aria-hidden="true">' + pcs + '</div>' +
    '<div class="app-card" aria-hidden="true"><div class="ac-head"><span class="ac-title">' + esc(t.list) + '</span>' +
    '<span class="ac-sub"><span class="ac-done">1</span><span class="ac-zero">0</span>/' + ROWS.length + '</span></div>' +
    '<ul class="ac-rows">' + rows + '</ul></div></div>';
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
.hero-copy{padding:40px 0 0}
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
.now-list{list-style:none;margin:20px -16px 0;padding:0 16px 8px;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(136px,1fr);gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:16px;scrollbar-width:none}
.now-list::-webkit-scrollbar{display:none}
.now-list li{scroll-snap-align:start}
.now-list a{display:flex;flex-direction:column;text-decoration:none;color:var(--paper-ink)}
.now-list .pic{display:grid;place-items:center;aspect-ratio:1;border-radius:20px;background:rgba(255,255,255,.45)}
.now-list img{width:72%;height:72%;object-fit:contain}
.now-list .emo{font-size:52px}
.now-list .nm{margin-top:10px;font-size:clamp(16px,1.1vw,20px);font-weight:600}
.now-list .rng{margin-top:2px;font-size:clamp(13px,.9vw,16px);color:var(--paper-2)}
@media (hover:hover){.now-list a:hover .pic{background:rgba(255,255,255,.75)}}

/* sahne: telefonda önce tezgâh, altında kart; masaüstünde kart solda, tezgâh sağda */
.stage{position:relative;font-size:clamp(13px,3.6vw,15px);margin:6px 0 0}
.pile{position:relative;aspect-ratio:1.55;margin:0 -4px}
.pc{position:absolute;left:var(--mx);top:var(--my);width:var(--mw);height:auto;transform:rotate(var(--r)) scaleX(var(--f));transform-origin:50% 60%}
.app-card{position:relative;z-index:10;margin:-8% 0 0;background:var(--card);border-radius:22px;padding:.9em .95em .35em;box-shadow:0 18px 44px rgba(70,45,20,.16),0 2px 6px rgba(70,45,20,.08)}
.ac-head{display:flex;align-items:baseline;justify-content:space-between;padding:0 .1em .55em}
.ac-title{font-size:1.32em;font-weight:700;letter-spacing:-.01em;color:var(--paper-ink)}
.ac-sub{font-size:.9em;font-weight:600;color:var(--paper-2);font-variant-numeric:tabular-nums}
.ac-sub .ac-zero{display:none}
.ac-rows{list-style:none;margin:0;padding:0}
.ac-row{display:flex;align-items:center;gap:.7em;min-height:3.35em;border-top:1px solid var(--card-rule)}
.chk{width:1.55em;height:1.55em;border-radius:50%;border:2px solid rgba(43,33,24,.22);flex:none;display:grid;place-items:center}
.chk svg{width:1em;height:1em;fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22}
.tile{width:2.5em;height:2.5em;border-radius:.7em;background:var(--tile);flex:none;display:grid;place-items:center}
.tile img{width:84%;height:84%;object-fit:contain}
.txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:.1em}
.nm{position:relative;align-self:flex-start;font-size:1.06em;font-weight:600;color:var(--paper-ink);white-space:nowrap}
.nm::after{content:"";position:absolute;left:0;right:0;top:55%;height:1.5px;background:currentColor;transform:scaleX(0);transform-origin:left}
.mt{font-size:.84em;color:var(--paper-2);font-variant-numeric:tabular-nums}
.leaf svg{width:1.05em;height:1.05em;fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block}
/* son hâl: ilk ürün işaretli */
.ac-row.first .chk{background:var(--accent);border-color:var(--accent)}
.ac-row.first .chk svg{stroke-dashoffset:0}
.ac-row.first .nm{color:var(--paper-2)}
.ac-row.first .nm::after{transform:scaleX(1)}
.ac-row.first .tile{opacity:.55}

/* açılış */
@keyframes pc-in{from{opacity:0;transform:translateY(18px) scale(.55) rotate(calc(var(--r) - 16deg)) scaleX(var(--f))}55%{opacity:1}to{opacity:1;transform:rotate(var(--r)) scaleX(var(--f))}}
@keyframes row-in{from{opacity:0;transform:translateY(-.6em)}to{opacity:1;transform:none}}
@keyframes card-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
@keyframes chk-in{from{background:transparent;border-color:rgba(43,33,24,.22)}to{background:var(--accent);border-color:var(--accent)}}
@keyframes draw{from{stroke-dashoffset:22}to{stroke-dashoffset:0}}
@keyframes strike{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes dim{from{opacity:1}to{opacity:.55}}
@keyframes ink{from{color:var(--paper-ink)}to{color:var(--paper-2)}}
@keyframes show{from{display:inline}to{display:inline}}
.stage.play .app-card{animation:card-in .42s var(--ease-out) both}
.stage.play .pc{animation:pc-in .56s var(--ease-back) both;animation-delay:var(--d)}
.stage.play .ac-row{animation:row-in .36s var(--ease-out) both;animation-delay:var(--d)}
.stage.play .ac-row.first .chk{animation:chk-in .22s ease-out both;animation-delay:var(--check)}
.stage.play .ac-row.first .chk svg{animation:draw .28s var(--ease-out) both;animation-delay:calc(var(--check) + 80ms)}
.stage.play .ac-row.first .nm::after{animation:strike .25s var(--ease-out) both;animation-delay:calc(var(--check) + 120ms)}
.stage.play .ac-row.first .nm{animation:ink .25s both;animation-delay:calc(var(--check) + 120ms)}
.stage.play .ac-row.first .tile{animation:dim .25s both;animation-delay:calc(var(--check) + 120ms)}
.stage.play .ac-sub .ac-done{animation:hide-then .01s both;animation-delay:var(--check)}
@keyframes hide-then{from{visibility:hidden;position:absolute}to{visibility:visible;position:static}}
.stage.play .ac-sub .ac-zero{display:inline;animation:hide-now .01s both;animation-delay:var(--check)}
@keyframes hide-now{from{visibility:visible}to{visibility:hidden;position:absolute}}

/* koyu tema: kâğıt gece rengi, kart uygulamanın koyu yüzeyi; parçalar kendi renginde */
${DARK('.home{--paper-ink:var(--text);--paper-2:var(--text2);--card:#1E1E1C;--card-rule:rgba(255,255,255,.08);--tile:#2A2A27}')}
${DARK('body.home{background:var(--bg)}')}
${DARK('body.home::before{display:none}')}
${DARK('.app-card{box-shadow:0 18px 44px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.4)}')}
${DARK('.chk{border-color:rgba(255,255,255,.25)}')}
${DARK('.soc{background:var(--surface);border-color:var(--border);color:var(--text)}')}
${DARK('.home{--paper-body:var(--text2)}')}
${DARK('.now-list .pic{background:var(--surface)}')}
${DARK('.now,.home .site-foot{border-top-color:var(--border)}')}

@media (min-width:900px){
  .hero{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:center;gap:clamp(24px,3vw,72px);padding:clamp(24px,6vh,104px) 0 0}
  .hero-copy{order:1;padding:0}
  .stage{order:2;font-size:clamp(12px,1.02vw,19px);aspect-ratio:1.32;margin:0}
  .pile{position:absolute;inset:0;aspect-ratio:auto;margin:0}
  .pc{left:var(--x);top:var(--y);width:var(--w)}
  .app-card{position:absolute;left:0;top:17%;width:50%;margin:0}
  .hero h1{font-size:clamp(52px,4.2vw,92px);margin-top:24px}
  .hero p.body{font-size:clamp(18px,1.2vw,22px);margin-top:24px;max-width:40ch}
  .follow{margin-top:40px}
  .now{margin-top:clamp(56px,8vh,120px);padding-top:clamp(28px,3vw,48px)}
  .now-list{margin:clamp(20px,2.4vw,40px) 0 0;padding:0;grid-auto-flow:row;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(12px,1.6vw,28px);overflow:visible}
  .eyebrow{font-size:clamp(13px,.9vw,16px);min-height:clamp(28px,2vw,36px);padding:0 clamp(12px,.9vw,16px)}
}
@media (min-width:1700px){.hero{grid-template-columns:minmax(0,6fr) minmax(0,7fr)}}
@media (prefers-reduced-motion:reduce){.stage.play *{animation:none!important}}
`;

/* Açılış: oturumda bir kez; dokunuş, kaydırma ya da tuşla anında son hâline geçer. */
const INTRO_JS = '(function(){var s=document.querySelector(".stage");if(!s)return;' +
  'var rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches,inside=false,reload=false;' +
  'try{inside=!!document.referrer&&new URL(document.referrer).host===location.host}catch(e){}' +
  'try{var n=performance.getEntriesByType("navigation")[0];reload=!!n&&n.type==="reload"}catch(e){}' +
  'if(rm||(inside&&!reload))return;s.classList.add("play");' +
  'function end(){s.classList.remove("play");["pointerdown","keydown","wheel","touchstart"].forEach(function(t){removeEventListener(t,end,true)})}' +
  '["pointerdown","keydown","wheel","touchstart"].forEach(function(t){addEventListener(t,end,{capture:true,passive:true})});' +
  'setTimeout(function(){["pointerdown","keydown","wheel","touchstart"].forEach(function(t){removeEventListener(t,end,true)})},3200)})();';

function render(lang, host) {
  const t = T[lang];
  const q = lang === 'en' ? '?lang=en' : '';
  const month = istanbulMonth();
  const body = '<div class="wrap">' + site.header(lang, '/?lang=' + (lang === 'tr' ? 'en' : 'tr'), null) +
    '<main class="hero">' + stage(lang) +
    '<div class="hero-copy">' +
    '<p class="eyebrow">' + esc(t.eyebrow) + '</p>' +
    '<h1>' + esc(t.title) + '</h1>' +
    '<p class="body">' + esc(t.body) + '</p>' +
    '<div class="follow"><span class="follow-label">' + esc(t.follow) + '</span><div class="soc-row">' +
    '<a class="soc" href="https://www.instagram.com/listem.app/" target="_blank" rel="noopener noreferrer" aria-label="' + esc(t.ig) + '">' + site.SOCIAL.instagram + '<span>Instagram</span></a>' +
    '<a class="soc" href="https://x.com/listemapp" target="_blank" rel="noopener noreferrer" aria-label="' + esc(t.x) + '">' + site.SOCIAL.x + '<span>X</span></a></div></div>' +
    '</div></main>' + nowSection(lang, month, q) + site.footer(lang, '') + '</div>' +
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
