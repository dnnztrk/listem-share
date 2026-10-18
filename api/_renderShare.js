'use strict';
/*
 * List-em — paylaşılan liste sayfası (list-em.app/s/<id>).
 *
 * Bu sayfa uygulamadaki liste ekranının ikizidir. Ölçüler, renkler, satır
 * metni ve kalori uygulamanın kendisinden gelir:
 *   - satır metni ve kalori: public/js/row-text.js (uygulamanın kaynağından üretilir)
 *   - ürün emojisi, reyon ve mevsim: public/data/catalog.json (uygulamanın kataloğu)
 *   - renk ve ölçüler: uygulamanın Taze Bahçe teması (aşağıdaki CSS değişkenleri)
 * Uygulama ikonları ya da kataloğu değişince bu iki dosya yeniden üretilir;
 * sayfa elle güncellenmez.
 */
const LZString = require('lz-string');
const QRCode = require('qrcode');
const catalog = require('../public/data/catalog.json');
const { rowText } = require('../public/js/row-text.js');

const PRODUCTS = new Map(catalog.products.map((p) => [p.id, p]));
const CATEGORIES = new Map(catalog.categories.map((c) => [c.id, c]));
const OTHER = CATEGORIES.get('Other') || { id: 'Other', order: 999, nameTr: 'Diğer', nameEn: 'Other', emoji: '🛒' };

const STR = {
  tr: {
    sharedWithYou: 'Seninle paylaşıldı',
    items: (n) => n + ' ürün',
    inSeasonCount: (n) => n + '’i mevsiminde',
    fallbackName: 'Alışveriş Listesi',
    done: (d, t) => d + ' / ' + t + ' tamamlandı',
    allDone: 'Liste tamamlandı',
    reset: 'Sıfırla',
    resetDone: 'Liste sıfırlandı.',
    undo: 'Geri al',
    completed: (n) => 'Tamamlananlar (' + n + ')',
    finishedTitle: 'Alışveriş tamamlandı',
    finishedBody: (n) => n + ' ürünün hepsi alındı.',
    inSeasonLand: '🌿 Mevsiminde',
    inSeasonSea: '🐟 Mevsiminde',
    qrTitle: 'Bu listeyi telefonunda aç',
    qrBody: 'Telefonunun kamerasını koda tut; aynı liste telefonunda açılır. Uygulama indirmen gerekmez.',
    qrNote: 'İşaretler cihazlar arasında taşınmaz; her cihaz kendi işaretlerini tutar.',
    copyLink: 'Bağlantıyı kopyala',
    copied: 'Bağlantı kopyalandı.',
    print: 'Yazdır',
    madeWith: 'Bu liste List-em ile hazırlandı.',
    localOnly: 'İşaretlerin yalnızca bu cihazda tutulur.',
    ttlDays: (d) => d <= 1 ? 'Bağlantı yarın kapanıyor.' : 'Bağlantı ' + d + ' gün daha açık.',
    ttlDefault: 'Paylaşılan listeler 30 gün açık kalır.',
    themeSystem: 'Görünüm: sistem',
    themeLight: 'Görünüm: açık',
    themeDark: 'Görünüm: koyu',
    otherLang: 'EN',
    otherLangLabel: 'Show in English',
    privacy: 'Gizlilik',
    expiredTitle: 'Bu bağlantının süresi doldu',
    expiredBody: 'Paylaşılan listeler 30 gün açık kalır. Listeyi gönderen kişiden yeni bir bağlantı isteyebilirsin.',
    expiredLink: 'List-em nedir?',
    ogList: (name, n) => '“' + name + '” listesi' + (n ? ' (' + n + ' ürün)' : '') + ' seninle paylaşıldı',
  },
  en: {
    sharedWithYou: 'Shared with you',
    items: (n) => n + (n === 1 ? ' item' : ' items'),
    inSeasonCount: (n) => n + ' in season',
    fallbackName: 'Shopping List',
    done: (d, t) => d + ' / ' + t + ' done',
    allDone: 'List complete',
    reset: 'Reset',
    resetDone: 'List reset.',
    undo: 'Undo',
    completed: (n) => 'Completed (' + n + ')',
    finishedTitle: 'Shopping done',
    finishedBody: (n) => 'All ' + n + ' items are in the basket.',
    inSeasonLand: '🌿 In Season',
    inSeasonSea: '🐟 In Season',
    qrTitle: 'Open this list on your phone',
    qrBody: 'Point your phone’s camera at the code; the same list opens on your phone. No app needed.',
    qrNote: 'Ticks don’t move between devices; each device keeps its own.',
    copyLink: 'Copy link',
    copied: 'Link copied.',
    print: 'Print',
    madeWith: 'This list was made with List-em.',
    localOnly: 'Your ticks are kept only on this device.',
    ttlDays: (d) => d <= 1 ? 'The link closes tomorrow.' : 'The link stays open for ' + d + ' more days.',
    ttlDefault: 'Shared lists stay open for 30 days.',
    themeSystem: 'Appearance: system',
    themeLight: 'Appearance: light',
    themeDark: 'Appearance: dark',
    otherLang: 'TR',
    otherLangLabel: 'Türkçe göster',
    privacy: 'Privacy',
    expiredTitle: 'This link has expired',
    expiredBody: 'Shared lists stay open for 30 days. You can ask the person who sent it for a new link.',
    expiredLink: 'What is List-em?',
    ogList: (name, n) => '“' + name + '” list' + (n ? ' (' + n + (n === 1 ? ' item)' : ' items)') : '') + ' shared with you',
  },
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function istanbulMonth() {
  try {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', month: 'numeric' }).format(new Date()));
  } catch (e) {
    return new Date().getMonth() + 1;
  }
}

function decode(data) {
  if (!data) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(data);
    if (!json) return null;
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

/* Payload → sayfanın modeli. Reyon sırası uygulamanın Sanal Reyon sırasıdır;
   uygulama ürünleri zaten raf sırasıyla gönderir, burada yalnız gruplanır. */
function buildModel(payload, lang) {
  const t = STR[lang];
  const month = istanbulMonth();
  const raw = Array.isArray(payload.items) ? payload.items : [];
  const items = [];
  raw.forEach((it) => {
    if (!it || (!it.name && !it.productId)) return;
    const product = it.productId ? PRODUCTS.get(it.productId) : null;
    let text;
    try {
      text = rowText({ productId: it.productId, name: it.name, variety: it.variety, quantity: it.quantity, qty: it.qty }, lang);
    } catch (e) {
      text = { title: it.name || '', second: null };
    }
    const cat = (product && CATEGORIES.get(product.category)) || OTHER;
    const season = product && product.season;
    const inSeason = !!(season && !season.yearRound && Array.isArray(season.months) && season.months.includes(month));
    const qty = Number(it.qty) > 1 ? Math.round(Number(it.qty)) : 0;
    items.push({
      index: items.length,
      title: text.title || it.name || '',
      second: text.second || '',
      emoji: (product && product.emoji) || it.emoji || cat.emoji || '🛒',
      cat,
      seasonKind: inSeason ? (season.kind === 'sea' ? 'sea' : 'land') : null,
      qty,
      done: !!it.done,
    });
  });

  const sections = [];
  const byCat = new Map();
  items.forEach((it) => {
    if (!byCat.has(it.cat.id)) {
      const s = { cat: it.cat, items: [] };
      byCat.set(it.cat.id, s);
      sections.push(s);
    }
    byCat.get(it.cat.id).items.push(it);
  });
  sections.sort((a, b) => (a.cat.order ?? 999) - (b.cat.order ?? 999));
  /* Sayfadaki sıra = bölümlerin sırası; Tamamlananlar bu sırayı kullanır. */
  let order = 0;
  sections.forEach((s) => s.items.forEach((it) => { it.order = order++; }));

  return {
    name: (typeof payload.name === 'string' && payload.name.trim()) || t.fallbackName,
    icon: (typeof payload.icon === 'string' && payload.icon) || '🛒',
    items,
    sections,
    inSeason: items.filter((it) => it.seasonKind).length,
  };
}

/* Uygulamadaki filiz (ikondaki filizin kendisi), üç parça: gövde ve iki yaprak. */
const SPROUT_STEM = 'M567.45 438.04Q568.43 407.02 573.45 381.63Q575.96 368.91 579.76 356.3L609.51 294.18L632.23 351.66Q624.51 371.22 620.61 390.94Q616.47 411.89 615.55 438.04Z';
const SPROUT_LEFT = 'M579.76 356.3C517.61 359.84 472.39 307.87 451.81 255.76C505.43 239.91 573.91 243.49 609.51 294.18Z';
const SPROUT_RIGHT = 'M609.51 294.18C639.34 219.85 723.9 198.21 793.19 204.62C776.77 277.75 723.76 357.66 632.23 351.66Z';
const LOGO_PATH = 'M231.1 332.12H292.73Q314.61 332.12 329.49 344.71Q344.05 357.03 348.02 378.21L360.32 438.04H567.45Q568.43 407.02 573.45 381.63Q575.96 368.91 579.76 356.3C517.61 359.84 472.39 307.87 451.81 255.76C505.43 239.91 573.91 243.49 609.51 294.18C639.34 219.85 723.9 198.21 793.19 204.62C776.77 277.75 723.76 357.66 632.23 351.66Q624.51 371.22 620.61 390.94Q616.47 411.89 615.55 438.04H753.03Q765.42 438.04 770.74 444.18Q776.16 450.44 774.21 463.08L756.88 572.86Q751.1 609.45 712.59 609.45H395.58L403.5 647.97H672.14Q678.27 647.97 683.93 650.32Q689.6 652.66 693.93 657Q698.26 661.33 700.61 666.99Q702.96 672.66 702.96 678.79Q702.96 684.91 700.61 690.58Q698.26 696.24 693.93 700.57Q689.6 704.91 683.93 707.25Q678.27 709.6 672.14 709.6H402.51Q379.66 709.6 364 697.07Q348.12 684.37 343.44 661.88L288.29 393.75H231.1Q224.97 393.75 219.31 391.4Q213.65 389.06 209.31 384.72Q204.98 380.39 202.63 374.73Q200.29 369.06 200.29 362.93Q200.29 356.8 202.63 351.14Q204.98 345.48 209.31 341.14Q213.65 336.81 219.31 334.46Q224.97 332.12 231.1 332.12ZM389.03 780.86C389.03 755.33 409.72 734.64 435.25 734.64C460.78 734.64 481.47 755.33 481.47 780.86C481.47 806.39 460.78 827.08 435.25 827.08C409.72 827.08 389.03 806.39 389.03 780.86ZM593.18 780.86C593.18 755.33 613.87 734.64 639.4 734.64C664.93 734.64 685.62 755.33 685.62 780.86C685.62 806.39 664.93 827.08 639.4 827.08C613.87 827.08 593.18 806.39 593.18 780.86Z';

const ICON = {
  check: '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.6l3.9 3.9L18 8.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.4a8.6 8.6 0 0 1 0 17.2z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  chevronDown: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5l5.5 5.5 5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10.2 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M13.8 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14.5h10v6H7z"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M7.8 12.4l2.8 2.8 5.6-5.8" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* İlerleme göstergesi: ikondaki filiz. Gövde, boğum ve iki yaprak ayrı çizilir; çizgi toprak gibi
   davranır (altı kırpılır). Biçimini ve hareketini sayfadaki betik çizer. */
function sproutSvg() {
  return '<svg viewBox="440 190 365 270" aria-hidden="true">' +
    '<defs><clipPath id="sprout-ground"><rect x="380" y="40" width="500" height="398.54"/></clipPath></defs>' +
    '<g clip-path="url(#sprout-ground)"><g class="plant-g">' +
    '<path class="plant stem-f" d="' + SPROUT_STEM + ' L615.55 446 L567.45 446 Z"/>' +
    '<circle class="plant node" cx="609" cy="318" r="16"/>' +
    '<path class="plant lf-l" d="' + SPROUT_LEFT + '"/>' +
    '<path class="plant lf-r" d="' + SPROUT_RIGHT + '"/>' +
    '</g></g></svg>';
}

function rowHtml(it, t) {
  const badge = it.seasonKind
    ? '<span class="badge badge-' + it.seasonKind + '">' + esc(it.seasonKind === 'sea' ? t.inSeasonSea : t.inSeasonLand) + '</span>'
    : '';
  const second = it.second ? '<span class="l2">' + esc(it.second) + '</span>' : '';
  const qty = it.qty ? '<span class="qty">×' + it.qty + '</span>' : '';
  return '<li class="row" data-i="' + it.index + '" data-o="' + it.order + '">' +
    '<button type="button" class="row-btn" aria-pressed="false">' +
    '<span class="check" aria-hidden="true"><span class="fill"></span>' + ICON.check + '</span>' +
    '<span class="emoji" aria-hidden="true">' + esc(it.emoji) + '</span>' +
    '<span class="txt"><span class="l1"><span class="name">' + esc(it.title) + '<span class="strike"></span></span>' + badge + '</span>' + second + '</span>' +
    qty +
    '</button></li>';
}

const CSS = `
:root{
  --bg:#F8F7F4;--surface:#EFEDE8;--border:#D8D5CE;--text:#0F0F0D;--text2:#6B6B63;--muted:#807D76;--disabled:#948F89;
  --accent:#2D8B75;--accent-muted:rgba(45,139,117,.082);--success:#3FA672;--emoji-bg:rgba(0,0,0,.04);--track:#DCD8CF;
  --land-bg:#D7E1DA;--land-ink:#236C5B;--sea-bg:#D4E1E0;--sea-ink:#136A7C;--qr-tile:#FFFFFF;--leaf-light:#7DC4A5;
  --hair:1px;color-scheme:light;
  --std:cubic-bezier(0,0,.2,1);--move:cubic-bezier(.4,0,.2,1);
}
@media (min-resolution:2dppx){:root{--hair:.5px}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#121210;--surface:#1E1D1A;--border:#2C2A26;--text:#EDEBE6;--text2:#8C8780;--muted:#6D6862;--disabled:#5A5A5A;
  --accent:#3AAF95;--accent-muted:rgba(58,175,149,.082);--success:#4FC486;--emoji-bg:rgba(255,255,255,.06);--track:#2C2A26;
  --land-bg:#202B25;--land-ink:#36A88D;--sea-bg:#1D2B2C;--sea-ink:#1EA4C0;--leaf-light:#2E8A70;color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#121210;--surface:#1E1D1A;--border:#2C2A26;--text:#EDEBE6;--text2:#8C8780;--muted:#6D6862;--disabled:#5A5A5A;
  --accent:#3AAF95;--accent-muted:rgba(58,175,149,.082);--success:#4FC486;--emoji-bg:rgba(255,255,255,.06);--track:#2C2A26;
  --land-bg:#202B25;--land-ink:#36A88D;--sea-bg:#1D2B2C;--sea-ink:#1EA4C0;--leaf-light:#2E8A70;color-scheme:dark}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
button{font:inherit;color:inherit}
a{color:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px 40px}
.bar{display:flex;align-items:center;justify-content:space-between;height:52px}
.brand{display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--accent);font-weight:600;font-size:17px;letter-spacing:-.2px}
.brand-tile{width:26px;height:26px;border-radius:7px;background:var(--accent);display:flex;align-items:center;justify-content:center}
.brand-tile svg{width:19px;height:19px;fill:var(--bg)}
.tools{display:flex;gap:8px}
.tool{width:44px;height:44px;border-radius:12px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);text-decoration:none}
.tool svg{width:18px;height:18px}
.tool.lang{font-size:13px;font-weight:600;letter-spacing:.3px;color:var(--text)}
.tool:active{opacity:.6}
.head{display:flex;align-items:center;gap:12px;padding:12px 0 0}
.face{flex:none;width:44px;height:44px;border-radius:12px;background:var(--accent-muted);display:flex;align-items:center;justify-content:center;font-size:20px}
.head h1{margin:0;font-size:28px;font-weight:700;letter-spacing:-.4px;line-height:1.1;overflow-wrap:anywhere}
.sub{margin:4px 0 0;font-size:13px;font-weight:500;color:var(--text2)}
.prog{margin:20px 0 0;background:var(--surface);border:.5px solid var(--border);border-radius:16px;padding:16px 16px 18px}
.prog-top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:32px}
.count{margin:0;font-size:15px;font-weight:600;color:var(--text2);font-variant-numeric:tabular-nums}
.count b{font-size:22px;font-weight:700;color:var(--text);margin-right:2px}
.prog.complete .count{color:var(--accent)}
.pill{border:0;border-radius:8px;padding:6px 10px;background:var(--accent-muted);color:var(--accent);font-size:13px;font-weight:600;cursor:pointer;min-height:32px}
.pill:active{opacity:.6}
.pill[hidden]{display:none}
.track{position:relative;margin-top:34px;height:4px;border-radius:2px;background:var(--track)}
.track-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:var(--accent);transition:width 250ms var(--move)}
.sprout{position:absolute;bottom:2px;left:0;width:36px;height:27px;transition:left 250ms var(--move)}
.sprout svg{position:absolute;left:0;bottom:0;width:36px;height:27px;overflow:visible}
.plant{fill:var(--accent);stroke:var(--accent);stroke-width:3;stroke-linejoin:round}
.finished{display:none;margin:16px 0 0;background:var(--surface);border:.5px solid var(--border);border-radius:16px;padding:20px;gap:12px;align-items:center}
.finished.on{display:flex}
.finished-icon{flex:none;width:36px;height:36px;border-radius:12px;background:var(--accent-muted);color:var(--accent);display:flex;align-items:center;justify-content:center}
.finished-icon svg{width:20px;height:20px}
.finished h2{margin:0;font-size:16px;font-weight:600;line-height:21px}
.finished p{margin:2px 0 0;font-size:13px;font-weight:500;color:var(--text2)}
.list{margin-top:8px}
.aisle[hidden],.done-sec[hidden]{display:none}
.aisle-h,.done-h{display:flex;align-items:center;gap:8px;margin:0;padding:24px 0 8px;font-size:13px;font-weight:600;color:var(--text2)}
.aisle-h .ae{font-size:13px}
.done-h{width:100%;border:0;background:none;cursor:pointer;text-align:left;justify-content:space-between;color:var(--text2)}
.done-h .chev{width:18px;height:18px;color:var(--disabled);transition:transform 250ms var(--std)}
.done-sec.closed .chev{transform:rotate(-90deg)}
.done-sec.closed ul{display:none}
ul{list-style:none;margin:0;padding:0}
.row{position:relative;background:var(--surface)}
.row+.row::before{content:"";position:absolute;left:0;top:0;width:108px;height:var(--hair);background:var(--bg);z-index:1}
.row+.row::after{content:"";position:absolute;left:108px;right:0;top:0;height:var(--hair);background:var(--border);z-index:1}
.row-btn{display:flex;align-items:center;width:100%;min-height:56px;padding:16px;border:0;background:transparent;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.row-btn:active{opacity:.7}
.row-btn:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.check{position:relative;flex:none;width:24px;height:24px;margin-right:16px;border-radius:50%;border:1.5px solid var(--text2);transition:border-color 0ms linear 100ms}
.fill{position:absolute;inset:-1.5px;border-radius:50%;background:var(--success);transform:scale(0);transition:transform 200ms var(--std)}
.tick{position:absolute;left:-1.5px;top:-1.5px;width:24px;height:24px;opacity:0}
.emoji{flex:none;width:36px;height:36px;margin-right:16px;border-radius:8px;background:var(--emoji-bg);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1}
.txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.l1{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;min-width:0}
.name{position:relative;min-width:0;max-width:100%;font-size:16px;font-weight:600;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.strike{position:absolute;left:0;top:50%;height:1.5px;margin-top:-.75px;width:0;background:var(--disabled);opacity:0;transition:width 250ms var(--std),opacity 250ms var(--std)}
.badge{flex:none;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;font-style:italic}
.badge-land{background:var(--land-bg);color:var(--land-ink)}
.badge-sea{background:var(--sea-bg);color:var(--sea-ink)}
.l2{font-size:11px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qty{flex:none;margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--accent);color:#fff;font-size:13px;font-weight:600}
.done .check{border-color:var(--success)}
.done .fill{transform:scale(1)}
.done .tick{opacity:1}
.done .name,.done .l2{color:var(--disabled)}
.done .strike{width:100%;opacity:1}
.done .emoji{opacity:.45}
.done .badge{display:none}
/* Satır Tamamlananlar'a taşınırken geçişler sıfırlanır; işaretin hareketi bu yüzden animasyonla oynar. */
.row.pop .check{animation:pop 220ms linear 160ms}
.row.pop .fill{animation:fillIn 200ms var(--std)}
.row.pop .strike{animation:strikeIn 250ms var(--std)}
.row.squash .check{animation:squash 160ms linear}
.row.squash .fill{animation:fillOut 200ms var(--std)}
.row.squash .strike{animation:strikeOut 250ms var(--std)}
@keyframes fillIn{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes fillOut{from{transform:scale(1)}to{transform:scale(0)}}
@keyframes strikeIn{from{width:0;opacity:0}to{width:100%;opacity:1}}
@keyframes strikeOut{from{width:100%;opacity:1}to{width:0;opacity:0}}
@keyframes pop{0%{transform:scale(1);animation-timing-function:cubic-bezier(0,0,.2,1)}45%{transform:scale(1.15);animation-timing-function:cubic-bezier(.4,0,.2,1)}100%{transform:scale(1)}}
@keyframes squash{0%{transform:scale(1);animation-timing-function:cubic-bezier(0,0,.2,1)}50%{transform:scale(.92);animation-timing-function:cubic-bezier(.4,0,.2,1)}100%{transform:scale(1)}}
.nofx,.nofx *{transition:none!important;animation:none!important}
.side{display:none}
.foot{margin:40px 0 0;font-size:13px;line-height:1.4;color:var(--text2);display:flex;flex-direction:column;gap:6px}
.foot a{color:var(--accent);text-decoration:none;font-weight:600}
.foot .made{color:var(--text)}
.toast{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;pointer-events:none;
  display:flex;align-items:center;gap:12px;padding:10px 10px 10px 16px;border-radius:12px;background:var(--text);color:var(--bg);font-size:14px;font-weight:500;
  transition:transform 250ms var(--std),opacity 250ms var(--std);max-width:calc(100% - 32px);z-index:5}
.toast.on{transform:translate(-50%,0);opacity:1;pointer-events:auto}
.toast button{border:0;border-radius:8px;min-height:36px;padding:8px 10px;background:transparent;color:var(--bg);font-weight:700;cursor:pointer;text-decoration:underline}
.toast button[hidden]{display:none}
@media (min-width:900px){
  .wrap{padding:0 40px 56px}
  .bar{height:64px}
  .layout{display:grid;grid-template-columns:minmax(0,640px) 300px;justify-content:center;gap:64px;align-items:start}
  .head{padding-top:24px}
  .head h1{font-size:34px}
  .side{display:block;position:sticky;top:24px;margin-top:24px;background:var(--surface);border:.5px solid var(--border);border-radius:16px;padding:20px}
  .side[hidden]{display:none}
  .side h2{margin:0;font-size:16px;font-weight:600;line-height:21px}
  .side p{margin:8px 0 0;font-size:13px;line-height:1.45;color:var(--text2)}
  .qr{margin:16px 0 0;background:var(--qr-tile);border-radius:12px;padding:16px;display:flex;justify-content:center}
  .qr svg{display:block;width:100%;height:auto;max-width:196px}
  .side .note{margin-top:12px}
  .actions{display:flex;flex-direction:column;gap:8px;margin-top:16px}
  .act{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 14px;border:.5px solid var(--border);border-radius:12px;background:var(--bg);font-size:15px;font-weight:600;color:var(--text);cursor:pointer}
  .act svg{width:18px;height:18px;color:var(--accent)}
  .act:active{opacity:.6}
}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
@media print{
  :root,:root[data-theme="dark"]{--bg:#fff;--surface:#fff;--border:#ccc;--text:#000;--text2:#444;--disabled:#666;--accent:#000;--accent-muted:#fff;--emoji-bg:#f2f2f2;--track:#ddd;color-scheme:light}
  .bar .tools,.side,.toast,.prog,.finished,.foot .ttl{display:none!important}
  .done-sec.closed ul{display:block}
  .row{break-inside:avoid}
  .layout{display:block}
}
`;

const CLIENT_JS = `
(function(){
  var D = JSON.parse(document.getElementById('share-data').textContent);
  var T = D.t;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn){ Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  /* İşaretler yalnız bu cihazda; ilk açılışta gönderenin işaretleri gelir. */
  var KEY = 'listem-ticks:' + D.key;
  var done = {};
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
  var celebrated = !!(stored && stored.c);
  if (stored && Array.isArray(stored.done)) stored.done.forEach(function(i){ done[i] = true; });
  else D.initialDone.forEach(function(i){ done[i] = true; });
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({ done: Object.keys(done).map(Number), c: celebrated })); } catch(e){} }
  function count(){ return Object.keys(done).length; }

  var rows = {}, homeList = {};
  each('.aisle', function(sec){
    var ul = sec.querySelector('ul');
    Array.prototype.forEach.call(ul.children, function(r){ rows[r.getAttribute('data-i')] = r; homeList[r.getAttribute('data-i')] = ul; });
  });
  var doneSec = document.getElementById('done-sec');
  var doneList = doneSec.querySelector('ul');
  var doneHead = doneSec.querySelector('.done-h');
  var doneTitle = doneSec.querySelector('.done-title');
  var total = D.total;

  function insertOrdered(list, row){
    var o = +row.getAttribute('data-o'), kids = list.children;
    for (var k = 0; k < kids.length; k++) {
      if (kids[k] === row) continue;
      if (+kids[k].getAttribute('data-o') > o) { if (kids[k] !== row.nextSibling || row.parentNode !== list) list.insertBefore(row, kids[k]); return; }
    }
    if (row.parentNode !== list || row.nextSibling) list.appendChild(row);
  }
  function place(i){
    var r = rows[i], isDone = !!done[i];
    r.classList.toggle('done', isDone);
    r.firstChild.setAttribute('aria-pressed', isDone ? 'true' : 'false');
    insertOrdered(isDone ? doneList : homeList[i], r);
  }
  function sections(){
    each('.aisle', function(sec){ sec.hidden = !sec.querySelector('ul').children.length; });
    var n = doneList.children.length;
    doneSec.hidden = n === 0;
    doneTitle.textContent = T.completed.replace('{n}', n);
  }

  /* İlerleme: ikondaki filiz. Her işarette sessizce bir adım büyür; bir reyon bitince bir kez
     sallanır; liste bitince büyür ve yapraklar saçılır, tamamlanma başına bir kez (hareket dili). */
  var prog = document.getElementById('prog');
  var fillEl = prog.querySelector('.track-fill');
  var sprout = document.getElementById('sprout');
  var plantG = sprout.querySelector('.plant-g'), stemEl = sprout.querySelector('.stem-f'), nodeEl = sprout.querySelector('.node');
  var lfL = sprout.querySelector('.lf-l'), lfR = sprout.querySelector('.lf-r');
  var countEl = document.getElementById('count');
  var resetBtn = document.getElementById('reset');
  var finished = document.getElementById('finished');
  var LEFT_D = lfL.getAttribute('d'), RIGHT_D = lfR.getAttribute('d');
  function c01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function eo(t){ return 1 - Math.pow(1 - t, 3); }
  function eio(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function spec(bx, by, tx, ty){ var dx = tx - bx, dy = ty - by, l = Math.sqrt(dx * dx + dy * dy); return { bx: bx, by: by, ux: dx / l, uy: dy / l }; }
  var LL = spec(594.6, 325.2, 451.81, 255.76), RL = spec(620.9, 322.9, 793.19, 204.62);
  var J = { x: 609.51, y: 294.18 }, B = { x: 591.5, y: 438.04 };
  function fx(n){ return n.toFixed(4); }
  function leafMatrix(sp, th, lam, wid, dx, dy){
    var ux = sp.ux, uy = sp.uy, vx = -uy, vy = ux;
    var m11 = lam * ux * ux + wid * vx * vx, m12 = lam * ux * uy + wid * vx * vy, m21 = lam * uy * ux + wid * vy * vx, m22 = lam * uy * uy + wid * vy * vy;
    var c = Math.cos(th), s = Math.sin(th);
    var a = c * m11 - s * m21, cc = c * m12 - s * m22, b = s * m11 + c * m21, d = s * m12 + c * m22;
    return 'matrix(' + [a, b, cc, d, sp.bx + dx - (a * sp.bx + cc * sp.by), sp.by + dy - (b * sp.bx + d * sp.by)].map(fx).join(' ') + ')';
  }
  function draw(g, sw, sc){
    var gs = Math.max(0, g), over = Math.max(0, g - 1);
    var sh = eo(c01(gs / 0.28)), lean = (1 - eio(c01((gs - 0.1) / 0.32))) * 0.42, wx = 0.62 + 0.38 * eo(c01(gs / 0.4)), k = -lean * sh;
    if (sh > 0.002) {
      stemEl.setAttribute('transform', 'matrix(' + [wx, 0, k, sh, B.x - wx * B.x - k * B.y, B.y - sh * B.y].map(fx).join(' ') + ')');
      stemEl.style.display = '';
    } else stemEl.style.display = 'none';
    var dX = B.x + wx * (J.x - B.x) + k * (J.y - B.y) - J.x, dY = B.y + sh * (J.y - B.y) - J.y;
    var ap = eo(c01((gs - 0.14) / 0.14));
    if (ap > 0.002) {
      var a = c01((gs - 0.14) / 0.6), b = c01((gs - 0.24) / 0.6);
      var Ls = ap * (0.32 + 0.68 * eo(a)) * (1 + over * 0.5), Rs = ap * (0.32 + 0.68 * eo(b)) * (1 + over * 0.5);
      var rL = 0.52 + 0.48 * eio(c01((gs - 0.22) / 0.6)), rR = 0.52 + 0.48 * eio(c01((gs - 0.32) / 0.58));
      var thL = (50 * Math.PI / 180) * (1 - eo(c01((gs - 0.18) / 0.66))) - over * 0.12;
      var thR = (-42 * Math.PI / 180) * (1 - eo(c01((gs - 0.27) / 0.62))) + over * 0.12;
      nodeEl.setAttribute('transform', 'translate(' + fx(dX) + ' ' + fx(dY) + ') translate(609 318) scale(' + fx(ap) + ') translate(-609 -318)');
      lfL.setAttribute('transform', leafMatrix(LL, thL, Ls, Ls * rL * (1 + over * 0.6), dX, dY));
      lfR.setAttribute('transform', leafMatrix(RL, thR, Rs, Rs * rR * (1 + over * 0.6), dX, dY));
      nodeEl.style.display = lfL.style.display = lfR.style.display = '';
    } else nodeEl.style.display = lfL.style.display = lfR.style.display = 'none';
    plantG.setAttribute('transform', 'rotate(' + sw.toFixed(3) + ' 591.5 438) translate(591.5 438) scale(' + fx(sc) + ') translate(-591.5 -438)');
  }
  function Spring(x, k, c){ this.x = x; this.v = 0; this.t = x; this.k = k; this.c = c; }
  Spring.prototype.step = function(dt){ this.v += (-this.k * (this.x - this.t) - this.c * this.v) * dt; this.x += this.v * dt; };
  Spring.prototype.rest = function(){ return Math.abs(this.x - this.t) < 0.0005 && Math.abs(this.v) < 0.0005; };
  var grow = new Spring(0, 150, 24), scale = new Spring(1, 260, 15), sway = new Spring(0, 180, 11);
  var running = false, lastT = 0;
  function advance(dt){
    var n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (var i = 0; i < n; i++) { grow.step(h); scale.step(h); sway.step(h); }
    draw(grow.x, sway.x, scale.x);
    return grow.rest() && scale.rest() && sway.rest();
  }
  function loop(t){
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
    if (advance(dt)) { running = false; lastT = 0; return; }
    requestAnimationFrame(loop);
  }
  function kick(){ if (!running) { running = true; lastT = 0; requestAnimationFrame(loop); } }

  /* Kutlama: canvas-confetti (public/js/confetti.browser.js, ISC). Yalnız gerektiğinde yüklenir. */
  var confettiP = null, leafShapes = null;
  function loadConfetti(){
    if (window.confetti) return Promise.resolve(window.confetti);
    if (!confettiP) confettiP = new Promise(function(res, rej){
      var el = document.createElement('script'); el.src = '/js/confetti.browser.js'; el.async = true;
      el.onload = function(){ window.confetti ? res(window.confetti) : rej(); }; el.onerror = rej;
      document.head.appendChild(el);
    });
    return confettiP;
  }
  function celebrate(){
    if (reduced) return;
    loadConfetti().then(function(cf){
      if (!leafShapes && cf.shapeFromPath) {
        leafShapes = [
          cf.shapeFromPath({ path: LEFT_D, matrix: [0.0634, 0, 0, 0.0634, -530.7 * 0.0634, -302.5 * 0.0634] }),
          cf.shapeFromPath({ path: RIGHT_D, matrix: [0.0544, 0, 0, 0.0544, -701.4 * 0.0544, -280 * 0.0544] })
        ];
      }
      var r = sprout.getBoundingClientRect();
      var origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height * 0.35) / window.innerHeight };
      var cs = getComputedStyle(document.documentElement);
      var base = { colors: [cs.getPropertyValue('--accent').trim(), cs.getPropertyValue('--success').trim(), cs.getPropertyValue('--leaf-light').trim()], origin: origin, scalar: 1.5, zIndex: 50, disableForReducedMotion: true };
      if (leafShapes) base.shapes = leafShapes;
      cf(Object.assign({}, base, { particleCount: 24, angle: 118, spread: 72, startVelocity: 21, gravity: 0.6, decay: 0.92, drift: -0.3, ticks: 270 }));
      setTimeout(function(){ cf(Object.assign({}, base, { particleCount: 14, angle: 88, spread: 56, startVelocity: 17, gravity: 0.58, decay: 0.92, drift: 0.15, ticks: 270 })); }, 140);
    }).catch(function(){});
  }

  function progress(mode, milestone){
    var d = count();
    var p = total ? d / total : 0;
    var pct = (p * 100).toFixed(2) + '%';
    var complete = total > 0 && d === total;
    fillEl.style.width = pct;
    sprout.style.left = 'clamp(-8px, calc(' + pct + ' - 18px), calc(100% - 28px))';
    prog.classList.toggle('complete', complete);
    countEl.innerHTML = complete ? T.allDone : T.done.replace('{d}', '<b>' + d + '</b>').replace('{t}', String(total));
    resetBtn.hidden = d === 0;
    finished.classList.toggle('on', complete);
    if (d === 0) celebrated = false;
    if (p >= 0.7 && !reduced) loadConfetti().catch(function(){});
    if (mode === 'still' || reduced) {
      grow.x = grow.t = p; grow.v = 0; scale.x = scale.t = complete ? 1.1 : 1; scale.v = 0; sway.x = sway.v = 0;
      draw(grow.x, 0, scale.x);
      return;
    }
    grow.t = p;
    if (complete) {
      scale.t = 1.1;
      if (!celebrated) { celebrated = true; scale.v += 2.4; celebrate(); }
    } else {
      scale.t = 1;
      if (milestone) sway.v += (d % 2 ? -1 : 1) * 95;
    }
    kick();
  }

  /* Satırın yer değiştirmesi: uygulamadaki yay (350 ms, sönüm 0,85). */
  var SPRING = 'cubic-bezier(.2,.9,.3,1)';
  try {
    if (window.CSS && CSS.supports('animation-timing-function', 'linear(0, 1)')) {
      var z = 0.85, w = 4.6 / (z * 0.35), wd = w * Math.sqrt(1 - z * z), pts = [];
      for (var s = 0; s <= 24; s++) {
        var tt = 0.35 * s / 24;
        pts.push((1 - Math.exp(-z * w * tt) * (Math.cos(wd * tt) + (z * w / wd) * Math.sin(wd * tt))).toFixed(4));
      }
      pts[pts.length - 1] = '1';
      SPRING = 'linear(' + pts.join(',') + ')';
    }
  } catch(e){}

  function snapshot(){
    var m = new Map();
    each('.row, .aisle-h, .done-h, #finished, .foot', function(el){
      if (el.offsetParent !== null) m.set(el, el.getBoundingClientRect().top);
    });
    return m;
  }
  function flip(before){
    if (reduced || !Element.prototype.animate) return;
    before.forEach(function(top, el){
      if (el.offsetParent === null) return;
      var dy = top - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }], { duration: 350, easing: SPRING });
    });
  }
  function settle(list){
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ list.forEach(function(r){ r.classList.remove('nofx'); }); }); });
  }

  var lastTap = 0;
  function toggle(i){
    var now = Date.now(), rapid = now - lastTap < 250;
    lastTap = now;
    var r = rows[i];
    var before = rapid ? null : snapshot();
    if (done[i]) delete done[i]; else done[i] = true;
    r.classList.remove('pop', 'squash');
    if (rapid || reduced) r.classList.add('nofx');
    place(i);
    sections();
    if (!rapid && !reduced) { void r.offsetWidth; r.classList.add(done[i] ? 'pop' : 'squash'); }
    var milestone = !!done[i] && homeList[i].children.length === 0 && count() < total;
    progress(rapid ? 'still' : 'tick', milestone);
    if (before) flip(before);
    if (rapid || reduced) settle([r]);
    save();
  }
  Object.keys(rows).forEach(function(i){
    rows[i].firstChild.addEventListener('click', function(){ toggle(i); });
  });

  doneHead.addEventListener('click', function(){
    var before = snapshot();
    var closed = doneSec.classList.toggle('closed');
    doneHead.setAttribute('aria-expanded', closed ? 'false' : 'true');
    flip(before);
  });

  /* Sıfırla: tek dokunuş, beş saniyelik geri alma şeridiyle. */
  var toast = document.getElementById('toast');
  var toastMsg = toast.querySelector('span');
  var toastBtn = toast.querySelector('button');
  var toastTimer = null, undoState = null;
  function showToast(msg, withUndo){
    toastMsg.textContent = msg;
    toastBtn.hidden = !withUndo;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('on'); undoState = null; }, withUndo ? 5000 : 2200);
  }
  function applyAll(){
    var before = snapshot();
    var all = Object.keys(rows).map(function(i){ rows[i].classList.add('nofx'); place(i); return rows[i]; });
    sections();
    progress('still');
    flip(before);
    settle(all);
    save();
  }
  function reset(){
    undoState = Object.keys(done);
    done = {};
    applyAll();
    showToast(T.resetDone, true);
  }
  resetBtn.addEventListener('click', reset);
  toastBtn.addEventListener('click', function(){
    if (!undoState) return;
    done = {};
    undoState.forEach(function(i){ done[i] = true; });
    undoState = null;
    applyAll();
    toast.classList.remove('on');
  });

  var copyBtn = document.getElementById('copy');
  if (copyBtn) copyBtn.addEventListener('click', function(){
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(D.url).then(function(){ showToast(T.copied, false); }, function(){});
    }
  });
  var printBtn = document.getElementById('print');
  if (printBtn) printBtn.addEventListener('click', function(){ window.print(); });

  /* İlk hâl: hareketsiz. */
  var all = Object.keys(rows).map(function(i){ rows[i].classList.add('nofx'); place(i); return rows[i]; });
  sections();
  progress('still');
  settle(all);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  }
})();
`;

const THEME_JS = `
(function(){
  /* Görünüm: sistem → açık → koyu. Seçim bu tarayıcıda saklanır, sitenin her sayfasında geçerli. */
  var root = document.documentElement, btn = document.getElementById('theme');
  if (!btn) return;
  var modes = ['system', 'light', 'dark'];
  var icons = JSON.parse(btn.getAttribute('data-icons'));
  var labels = JSON.parse(btn.getAttribute('data-labels'));
  function set(m, save){
    if (m === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', m);
    if (save) { try { if (m === 'system') localStorage.removeItem('listem-theme'); else localStorage.setItem('listem-theme', m); } catch(e){} }
    btn.innerHTML = icons[m];
    btn.setAttribute('aria-label', labels[m]);
    btn.setAttribute('data-mode', m);
  }
  set(root.getAttribute('data-theme') || 'system', false);
  btn.addEventListener('click', function(){ set(modes[(modes.indexOf(btn.getAttribute('data-mode')) + 1) % 3], true); });
})();
`;

/* Görünüm seçimi ilk boyamadan önce uygulanır: gece açılan sayfa bir an bile parlamaz. */
const THEME_BOOT = "(function(){try{var m=localStorage.getItem('listem-theme');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();";

function pageShell({ lang, title, ogTitle, ogDescription, host, body, inlineData }) {
  return '<!doctype html>\n<html lang="' + lang + '">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="color-scheme" content="light dark">\n' +
    '<meta name="theme-color" content="#F8F7F4" media="(prefers-color-scheme: light)">\n' +
    '<meta name="theme-color" content="#121210" media="(prefers-color-scheme: dark)">\n' +
    '<script>' + THEME_BOOT + '</script>\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta property="og:title" content="' + esc(ogTitle) + '">\n' +
    '<meta property="og:description" content="' + esc(ogDescription) + '">\n' +
    '<meta property="og:image" content="https://' + esc(host) + '/og-image.png">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="robots" content="noindex">\n' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
    '<style>' + CSS + '</style>\n' +
    '</head>\n<body>\n' + body + '\n' +
    '<script>' + THEME_JS + '</script>\n' +
    (inlineData ? '<script type="application/json" id="share-data">' + inlineData + '</script>\n<script>' + CLIENT_JS + '</script>\n' : '') +
    '</body>\n</html>';
}

function topBar(t, lang, langHref) {
  return '<header class="bar">' +
    '<a class="brand" href="https://list-em.app"><span class="brand-tile"><svg viewBox="180 180 640 660" aria-hidden="true"><path d="' + LOGO_PATH + '"/></svg></span>List-em</a>' +
    '<div class="tools">' +
    '<a class="tool lang" href="' + esc(langHref) + '" hreflang="' + (lang === 'tr' ? 'en' : 'tr') + '" aria-label="' + esc(t.otherLangLabel) + '">' + t.otherLang + '</a>' +
    '<button type="button" class="tool" id="theme" aria-label="' + esc(t.themeSystem) + '" data-icons="' + esc(JSON.stringify({ system: ICON.system, light: ICON.light, dark: ICON.dark })) + '" data-labels="' + esc(JSON.stringify({ system: t.themeSystem, light: t.themeLight, dark: t.themeDark })) + '">' + ICON.system + '</button>' +
    '</div></header>';
}

function hashKey(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'd' + (h >>> 0).toString(36);
}

/**
 * renderShareHTML(data, host, opts)
 *   data — LZString ile sıkıştırılmış paylaşım verisi
 *   opts — { id, url, lang, ttlSeconds, qrSvg, langBase }
 *          langBase: dil bağlantısının önü ('/s/<id>?' ya da '/share?data=…&'); liste verisi kaybolmasın diye
 */
function renderShareHTML(data, host, opts) {
  opts = opts || {};
  const payload = decode(data) || {};
  const lang = opts.lang === 'en' || opts.lang === 'tr' ? opts.lang : (payload.lang === 'en' ? 'en' : 'tr');
  const t = STR[lang];
  const model = buildModel(payload, lang);
  const total = model.items.length;
  const url = opts.url || ('https://' + host + '/');
  const langHref = (opts.langBase || '?') + 'lang=' + (lang === 'tr' ? 'en' : 'tr');

  const subParts = [t.sharedWithYou, t.items(total)];
  if (model.inSeason > 0) subParts.push(t.inSeasonCount(model.inSeason));

  const sectionsHtml = model.sections.map((s) =>
    '<section class="aisle" data-cat="' + esc(s.cat.id) + '">' +
    '<h2 class="aisle-h"><span class="ae" aria-hidden="true">' + esc(s.cat.emoji || '') + '</span>' + esc(lang === 'en' ? s.cat.nameEn : s.cat.nameTr) + '</h2>' +
    '<ul>' + s.items.map((it) => rowHtml(it, t)).join('') + '</ul></section>'
  ).join('');

  let ttlLine = t.ttlDefault;
  if (typeof opts.ttlSeconds === 'number' && opts.ttlSeconds > 0) ttlLine = t.ttlDays(Math.ceil(opts.ttlSeconds / 86400));

  const side = opts.qrSvg
    ? '<aside class="side" aria-labelledby="qr-title">' +
      '<h2 id="qr-title">' + esc(t.qrTitle) + '</h2>' +
      '<p>' + esc(t.qrBody) + '</p>' +
      '<div class="qr">' + opts.qrSvg.replace('<svg', '<svg role="img" aria-label="QR"') + '</div>' +
      '<p class="note">' + esc(t.qrNote) + '</p>' +
      '<div class="actions">' +
      '<button type="button" class="act" id="copy">' + ICON.link + esc(t.copyLink) + '</button>' +
      '<button type="button" class="act" id="print">' + ICON.print + esc(t.print) + '</button>' +
      '</div></aside>'
    : '';

  const body =
    '<div class="wrap">' +
    topBar(t, lang, langHref) +
    '<div class="layout"><main class="main">' +
    '<div class="head"><span class="face" aria-hidden="true">' + esc(model.icon) + '</span><div>' +
    '<h1>' + esc(model.name) + '</h1>' +
    '<p class="sub">' + esc(subParts.join(' · ')) + '</p></div></div>' +
    '<section class="prog" id="prog" aria-live="polite">' +
    '<div class="prog-top"><p class="count" id="count"></p><button type="button" class="pill" id="reset" hidden>' + esc(t.reset) + '</button></div>' +
    '<div class="track" aria-hidden="true"><div class="track-fill"></div>' +
    '<div class="sprout" id="sprout">' + sproutSvg() + '</div>' +
    '</div></section>' +
    '<section class="finished" id="finished"><span class="finished-icon">' + ICON.checkCircle + '</span><div>' +
    '<h2>' + esc(t.finishedTitle) + '</h2><p>' + esc(t.finishedBody(total)) + '</p></div></section>' +
    '<div class="list">' + sectionsHtml +
    '<section class="done-sec" id="done-sec" hidden>' +
    '<button type="button" class="done-h" aria-expanded="true"><span class="done-title"></span>' + ICON.chevronDown + '</button>' +
    '<ul></ul></section></div>' +
    '<footer class="foot"><span class="made">' + esc(t.madeWith) + ' <a href="https://list-em.app">list-em.app</a></span>' +
    '<span>' + esc(t.localOnly) + '</span><span class="ttl">' + esc(ttlLine) + '</span>' +
    '<span><a href="/gizlilik">' + esc(t.privacy) + '</a></span></footer>' +
    '</main>' + side + '</div></div>' +
    '<div class="toast" id="toast" role="status"><span></span><button type="button" hidden>' + esc(t.undo) + '</button></div>';

  const inlineData = JSON.stringify({
    key: opts.id || hashKey(data || ''),
    url,
    total,
    initialDone: model.items.filter((it) => it.done).map((it) => it.index),
    t: {
      done: t.done('{d}', '{t}'),
      allDone: t.allDone,
      completed: t.completed('{n}'),
      resetDone: t.resetDone,
      copied: t.copied,
    },
  }).replace(/</g, '\\u003c');

  return pageShell({
    lang,
    title: model.name + ' · List-em',
    ogTitle: model.icon + ' ' + model.name + (total ? ' (' + t.items(total) + ')' : ''),
    ogDescription: t.ogList(model.name, total),
    host,
    body,
    inlineData,
  });
}

function renderExpiredHTML(host, opts) {
  opts = opts || {};
  const lang = opts.lang === 'en' ? 'en' : 'tr';
  const t = STR[lang];
  const body = '<div class="wrap">' + topBar(t, lang, '?lang=' + (lang === 'tr' ? 'en' : 'tr')) +
    '<main style="max-width:520px;margin:0 auto;padding-top:18vh">' +
    '<span class="face" aria-hidden="true">⏳</span>' +
    '<h1 style="margin:16px 0 0;font-size:22px;font-weight:700;letter-spacing:-.3px">' + esc(t.expiredTitle) + '</h1>' +
    '<p class="sub" style="font-size:15px;line-height:1.45;margin-top:8px">' + esc(t.expiredBody) + '</p>' +
    '<p style="margin-top:20px"><a href="https://list-em.app" style="color:var(--accent);font-weight:600;text-decoration:none">' + esc(t.expiredLink) + '</a></p>' +
    '</main></div>';
  return pageShell({ lang, title: t.expiredTitle + ' · List-em', ogTitle: 'List-em', ogDescription: t.expiredTitle, host, body, inlineData: null });
}

async function qrSvgFor(url) {
  if (!url || url.length > 1200) return '';
  try {
    return await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0F0F0DFF', light: '#FFFFFFFF' } });
  } catch (e) {
    return '';
  }
}

module.exports = renderShareHTML;
module.exports.renderShareHTML = renderShareHTML;
module.exports.renderExpiredHTML = renderExpiredHTML;
module.exports.qrSvgFor = qrSvgFor;
module.exports.decode = decode;
