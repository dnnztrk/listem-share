'use strict';
/*
 * Ana sayfa (list-em.app) — ilk ekran. Görsel dil: mevsim afişi (düz çizim, risograf dokusu,
 * krem kâğıt). Şimdilik ekim afişi; her ayın kendi afişi gelince ay ay değişecek.
 * Söz önce gelir; reyon sırası tek başına öne çıkarılmaz. Gerçek ana sayfanın geri kalanı
 * (oynanabilir liste, Neden, paylaşım) site turunda bu ekranın altına eklenecek.
 */
const site = require('./_site');
const catalog = require('../public/data/catalog.json');
const { esc } = site;

const T = {
  tr: {
    eyebrow: 'Çok yakında App Store’da',
    title: 'Türkiye’ye özel market alışveriş listesi',
    body: 'Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilen; markette reyon sırasına dizilen; uygulaması olmayanın da açabildiği bir alışveriş listesi.',
    ig: 'Instagram’da takip et', x: 'X’te takip et',
    inSeason: ['Ocak’ta', 'Şubat’ta', 'Mart’ta', 'Nisan’da', 'Mayıs’ta', 'Haziran’da', 'Temmuz’da', 'Ağustos’ta', 'Eylül’de', 'Ekim’de', 'Kasım’da', 'Aralık’ta'].map((m) => m + ' mevsiminde'),
    all: 'Takvimin tamamı',
    art: 'Ekim pazarı: nar, ayva, hurma, mandalina, kestane ve hamsi; düz çizim bir afiş.',
    meta: 'List-em: Türkiye’ye özel market alışveriş listesi. Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilir. Çok yakında App Store’da.',
  },
  en: {
    eyebrow: 'Coming soon to the App Store',
    title: 'A grocery list made for Turkey',
    body: 'It knows products by weight, calories and season; it puts your list in aisle order; and anyone can open a shared list without the app.',
    ig: 'Follow on Instagram', x: 'Follow on X',
    inSeason: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => 'In season in ' + m),
    all: 'The whole calendar',
    art: 'An October market: pomegranates, quinces, persimmons, mandarins, chestnuts and anchovies, drawn as a flat poster.',
    meta: 'List-em: a grocery list made for Turkey. It knows products by weight, calories and season. Coming soon to the App Store.',
  },
};

/* Afişteki ürünler önce; ay değişince katalog ne diyorsa o. */
const FEATURED = ['nar', 'ayva', 'trabzon-hurmasi', 'mandalina', 'hamsi'];
function inSeasonNow(month, lang) {
  const ok = (p) => p.season && !p.season.yearRound && p.season.months.includes(month) && ['Fruit', 'Vegetables', 'Fish'].includes(p.category);
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  const first = FEATURED.map((id) => byId.get(id)).filter((p) => p && ok(p));
  const rest = catalog.products.filter((p) => ok(p) && !FEATURED.includes(p.id));
  return first.concat(rest).slice(0, 5).map((p) => ({ name: lang === 'en' ? p.nameEn : p.nameTr, emoji: p.emoji }));
}
function istanbulMonth() {
  try { return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', month: 'numeric' }).format(new Date())); }
  catch (e) { return new Date().getMonth() + 1; }
}

/* Risograf dokusu: afişin kâğıdıyla metnin durduğu alan aynı kâğıt olsun. */
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .12 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CSS = `
:root{--paper:#F7E8CE;--paper-ink:#2B2118}
body.home{background:var(--paper)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) body.home{background:var(--bg)}}
:root[data-theme="dark"] body.home{background:var(--bg)}
.home .wrap{position:relative}
.hero{position:relative;display:grid;gap:8px;padding-bottom:8px}
body.home::before{content:"";position:fixed;inset:0;background-image:${GRAIN};opacity:.16;mix-blend-mode:multiply;pointer-events:none;z-index:3}
.hero-art{margin:4px -16px 0;position:relative}
.hero-art img{display:block;width:100%;height:auto;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 9%,#000 88%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 9%,#000 88%,transparent 100%)}
@media (min-width:900px){.hero-art img{-webkit-mask-image:radial-gradient(120% 95% at 62% 50%,#000 62%,transparent 96%);mask-image:radial-gradient(120% 95% at 62% 50%,#000 62%,transparent 96%)}}
.hero-copy{position:relative;padding:8px 0 0}
.eyebrow{margin:0;display:inline-flex;align-items:center;min-height:28px;padding:0 12px;border-radius:999px;background:rgba(45,139,117,.12);color:var(--accent);font-size:13px;font-weight:600}
.hero h1{margin:16px 0 0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:40px;line-height:1.03;letter-spacing:-.025em;color:var(--paper-ink)}
.hero p.body{margin:14px 0 0;font-size:17px;line-height:1.5;color:#5E5245}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;border-radius:12px;font-size:16px;font-weight:600;text-decoration:none}
.btn.primary{background:var(--accent);color:#fff}
.btn.secondary{border:1px solid rgba(43,33,24,.18);background:rgba(255,255,255,.35);color:var(--paper-ink)}
.btn:active{opacity:.6}
.season{margin-top:28px}
.season h2{margin:0;font-size:13px;font-weight:600;color:#5E5245}
.season ul{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.season li a{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.5);border:1px solid rgba(43,33,24,.1);color:var(--paper-ink);font-size:14px;font-weight:600;text-decoration:none}
.season .all{display:inline-flex;align-items:center;min-height:44px;margin-top:6px;color:var(--accent);font-weight:600;text-decoration:none}
.home .site-foot{border-top-color:rgba(43,33,24,.14)}
/* koyu: afiş kâğıdı ekranı aydınlatmasın — kart içinde, hafif kısık */
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .home{--paper-ink:var(--text)}
  :root:not([data-theme="light"]) body.home::before{display:none}
  :root:not([data-theme="light"]) .hero-art{margin:4px 0 0}
  :root:not([data-theme="light"]) .hero-art img{border-radius:16px;filter:brightness(.82) saturate(.92);-webkit-mask-image:none;mask-image:none}
  :root:not([data-theme="light"]) .hero p.body,:root:not([data-theme="light"]) .season h2{color:var(--text2)}
  :root:not([data-theme="light"]) .btn.secondary,:root:not([data-theme="light"]) .season li a{background:var(--surface);border-color:var(--border)}}
:root[data-theme="dark"] .home{--paper-ink:var(--text)}
:root[data-theme="dark"] body.home::before{display:none}
:root[data-theme="dark"] .hero-art{margin:4px 0 0}
:root[data-theme="dark"] .hero-art img{border-radius:16px;filter:brightness(.82) saturate(.92);-webkit-mask-image:none;mask-image:none}
:root[data-theme="dark"] .hero p.body,:root[data-theme="dark"] .season h2{color:var(--text2)}
:root[data-theme="dark"] .btn.secondary,:root[data-theme="dark"] .season li a{background:var(--surface);border-color:var(--border)}
@media (min-width:900px){
  .hero{grid-template-columns:minmax(0,5fr) minmax(0,7fr);align-items:center;gap:24px;min-height:calc(100svh - 68px - 40px);padding:8px 0 24px}
  .hero-copy{order:1;padding:0}
  .hero-art{order:2;margin:0 -40px 0 0}
  .hero h1{font-size:62px}
  .hero p.body{font-size:19px;max-width:30em}
}
@media (min-width:900px){:root[data-theme="dark"] .hero-art{margin:0}}
@media (min-width:900px) and (prefers-color-scheme:dark){:root:not([data-theme="light"]) .hero-art{margin:0}}
`;

function render(lang, host) {
  const t = T[lang];
  const q = lang === 'en' ? '?lang=en' : '';
  const month = istanbulMonth();
  const chips = inSeasonNow(month, lang).map((p) =>
    '<li><a href="/mevsim' + (q ? q + '&' : '?') + 'ay=' + month + '"><span aria-hidden="true">' + esc(p.emoji) + '</span>' + esc(p.name) + '</a></li>').join('');
  const body = '<div class="wrap">' + site.header(lang, '/?lang=' + (lang === 'tr' ? 'en' : 'tr'), null) +
    '<main class="hero">' +
    '<figure class="hero-art" style="margin-bottom:0"><picture>' +
    '<source media="(min-width: 900px)" srcset="/img/ekim-afis-dar.webp" type="image/webp">' +
    '<img src="/img/ekim-afis-dar.webp" width="900" height="675" alt="' + esc(t.art) + '" fetchpriority="high"></picture></figure>' +
    '<div class="hero-copy">' +
    '<p class="eyebrow">' + esc(t.eyebrow) + '</p>' +
    '<h1>' + esc(t.title) + '</h1>' +
    '<p class="body">' + esc(t.body) + '</p>' +
    '<div class="cta"><a class="btn primary" href="https://www.instagram.com/listem.app/" rel="noopener">' + esc(t.ig) + '</a>' +
    '<a class="btn secondary" href="https://x.com/listemapp" rel="noopener">' + esc(t.x) + '</a></div>' +
    (chips ? '<section class="season"><h2>' + esc(t.inSeason[month - 1]) + '</h2><ul>' + chips + '</ul>' +
      '<a class="all" href="/mevsim' + q + '">' + esc(t.all) + ' →</a></section>' : '') +
    '</div></main>' + site.footer(lang, '') + '</div>';
  return site.pageShell({ lang, title: 'List-em · ' + t.title, description: t.meta, ogTitle: 'List-em', ogDescription: t.meta, host, css: CSS, body: body.replace('<div class="wrap">', '<div class="wrap">'), bodyClass: 'home', index: true });
}

module.exports = (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(lang, req.headers.host || 'list-em.app'));
};
module.exports.render = render;
