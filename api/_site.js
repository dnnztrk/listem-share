'use strict';
/*
 * List-em sitesi — her sayfanın ortak iskeleti.
 * Renkler uygulamanın Taze Bahçe teması (açık ve koyu); yazı, başlık, alt bilgi ve görünüm
 * seçimi buradan gelir. Sayfalar yalnız kendi içeriklerini yazar; ikinci bir kopya yoktur.
 * Marka: içeride (site sayfaları) krem zemin, yeşil ve tek renk işaret; kelime Fraunces.
 */

const LOGO_PATH = 'M231.1 332.12H292.73Q314.61 332.12 329.49 344.71Q344.05 357.03 348.02 378.21L360.32 438.04H567.45Q568.43 407.02 573.45 381.63Q575.96 368.91 579.76 356.3C517.61 359.84 472.39 307.87 451.81 255.76C505.43 239.91 573.91 243.49 609.51 294.18C639.34 219.85 723.9 198.21 793.19 204.62C776.77 277.75 723.76 357.66 632.23 351.66Q624.51 371.22 620.61 390.94Q616.47 411.89 615.55 438.04H753.03Q765.42 438.04 770.74 444.18Q776.16 450.44 774.21 463.08L756.88 572.86Q751.1 609.45 712.59 609.45H395.58L403.5 647.97H672.14Q678.27 647.97 683.93 650.32Q689.6 652.66 693.93 657Q698.26 661.33 700.61 666.99Q702.96 672.66 702.96 678.79Q702.96 684.91 700.61 690.58Q698.26 696.24 693.93 700.57Q689.6 704.91 683.93 707.25Q678.27 709.6 672.14 709.6H402.51Q379.66 709.6 364 697.07Q348.12 684.37 343.44 661.88L288.29 393.75H231.1Q224.97 393.75 219.31 391.4Q213.65 389.06 209.31 384.72Q204.98 380.39 202.63 374.73Q200.29 369.06 200.29 362.93Q200.29 356.8 202.63 351.14Q204.98 345.48 209.31 341.14Q213.65 336.81 219.31 334.46Q224.97 332.12 231.1 332.12ZM389.03 780.86C389.03 755.33 409.72 734.64 435.25 734.64C460.78 734.64 481.47 755.33 481.47 780.86C481.47 806.39 460.78 827.08 435.25 827.08C409.72 827.08 389.03 806.39 389.03 780.86ZM593.18 780.86C593.18 755.33 613.87 734.64 639.4 734.64C664.93 734.64 685.62 755.33 685.62 780.86C685.62 806.39 664.93 827.08 639.4 827.08C613.87 827.08 593.18 806.39 593.18 780.86Z';

const SITE = {
  tr: {
    tagline: 'Türkiye’ye özel market alışveriş listesi',
    nav: { season: 'Mevsim Takvimi' },
    themeSystem: 'Görünüm: sistem', themeLight: 'Görünüm: açık', themeDark: 'Görünüm: koyu',
    otherLang: 'EN', otherLangLabel: 'Show in English',
    privacy: 'Gizlilik', terms: 'Koşullar', contact: 'İletişim',
    home: 'Ana sayfa',
  },
  en: {
    tagline: 'A grocery list made for Turkey',
    nav: { season: 'Seasonal Calendar' },
    themeSystem: 'Appearance: system', themeLight: 'Appearance: light', themeDark: 'Appearance: dark',
    otherLang: 'TR', otherLangLabel: 'Türkçe göster',
    privacy: 'Privacy', terms: 'Terms', contact: 'Contact',
    home: 'Home',
  },
};

const SOCIAL = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5z"/></svg>',
};

const ICON = {
  system: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.4a8.6 8.6 0 0 1 0 17.2z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const FONT_CSS = `
@font-face{font-family:"Fraunces";font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/fraunces-latin-ext-soft-normal.woff2) format("woff2-variations"),url(/fonts/fraunces-latin-ext-soft-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Fraunces";font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/fraunces-latin-soft-normal.woff2) format("woff2-variations"),url(/fonts/fraunces-latin-soft-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Inter";font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/inter-latin-ext-wght-normal.woff2) format("woff2-variations"),url(/fonts/inter-latin-ext-wght-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter";font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/inter-latin-wght-normal.woff2) format("woff2-variations"),url(/fonts/inter-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
`;

/* Uygulamanın Taze Bahçe teması. Görünüm seçimi html[data-theme]'i ayarlar; seçim yoksa sistem. */
const DARK = '--bg:#121210;--surface:#1E1D1A;--border:#2C2A26;--text:#EDEBE6;--text2:#8C8780;--muted:#6D6862;--disabled:#5A5A5A;' +
  '--accent:#3AAF95;--accent-muted:rgba(58,175,149,.082);--success:#4FC486;--emoji-bg:rgba(255,255,255,.06);--track:#2C2A26;' +
  '--land-bg:#202B25;--land-ink:#36A88D;--sea-bg:#1D2B2C;--sea-ink:#1EA4C0;--leaf-light:#2E8A70;color-scheme:dark';
const TOKENS_CSS = `
:root{
  --bg:#F8F7F4;--surface:#EFEDE8;--border:#D8D5CE;--text:#0F0F0D;--text2:#6B6B63;--muted:#807D76;--disabled:#948F89;
  --accent:#2D8B75;--accent-muted:rgba(45,139,117,.082);--success:#3FA672;--emoji-bg:rgba(0,0,0,.04);--track:#DCD8CF;
  --land-bg:#D7E1DA;--land-ink:#236C5B;--sea-bg:#D4E1E0;--sea-ink:#136A7C;--qr-tile:#FFFFFF;--leaf-light:#7DC4A5;
  --hair:1px;color-scheme:light;
  --std:cubic-bezier(0,0,.2,1);--move:cubic-bezier(.4,0,.2,1);
  --serif:"Fraunces",Georgia,"Times New Roman",serif;
}
@media (min-resolution:2dppx){:root{--hair:.5px}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${DARK}}}
:root[data-theme="dark"]{${DARK}}
`;

const BASE_CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI","Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
button{font:inherit;color:inherit}
a{color:inherit}
.wrap{max-width:1320px;margin:0 auto;padding:0 16px 40px}
.serif{font-family:var(--serif);font-variation-settings:"SOFT" 100;font-optical-sizing:auto}
.bar{display:flex;align-items:center;justify-content:space-between;gap:8px;height:56px}
.lockup{display:flex;align-items:center;gap:7px;text-decoration:none;color:var(--accent);min-height:44px}
.lockup svg{width:clamp(26px,1.7vw,34px);height:clamp(26px,1.7vw,34px);fill:currentColor;flex:none}
.wordmark{font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:clamp(21px,1.4vw,28px);letter-spacing:-.01em;line-height:1}
.bar-right{display:flex;align-items:center;gap:4px}
.nav{display:flex;align-items:center;gap:4px;margin-right:4px}
.nav a{display:flex;align-items:center;min-height:44px;padding:0 10px;border-radius:10px;font-size:clamp(14px,.95vw,17px);font-weight:600;color:var(--text2);text-decoration:none}
.nav a[aria-current="page"]{color:var(--text)}
.nav a:active{opacity:.6}
.tool{width:44px;height:44px;border-radius:12px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);text-decoration:none}
.tool svg{width:18px;height:18px}
.tool.lang{font-size:13px;font-weight:600;letter-spacing:.3px;color:var(--text)}
.tool:active{opacity:.6}
.site-foot{margin-top:56px;padding-top:24px;border-top:var(--hair) solid var(--border);display:grid;gap:14px;font-size:13px;line-height:1.45;color:var(--text2)}
.site-foot .lead{color:var(--text);font-size:14px}
.site-foot .lead a{color:var(--accent);font-weight:600;text-decoration:none}
.foot-brand{display:flex;align-items:center;gap:10px;color:var(--accent);text-decoration:none}
.foot-brand svg{width:22px;height:22px;fill:currentColor}
.foot-brand .wordmark{font-size:18px}
.foot-tag{color:var(--text2);font-size:13px}
.foot-links{display:flex;flex-wrap:wrap;gap:4px 18px}
.foot-links a{color:var(--text);text-decoration:none;font-weight:500;min-height:32px;display:inline-flex;align-items:center}
.foot-links a:active{opacity:.6}
.foot-copy{color:var(--muted);font-size:12px}
@media (max-width:380px){.nav a{padding:0 6px;font-size:13px}}
@media (min-width:1700px){.wrap{max-width:1640px}}
@media (min-width:900px){
  .wrap{padding:0 clamp(40px,4vw,72px) 56px}
  .bar{height:clamp(68px,5vw,88px)}
  .site-foot{grid-template-columns:1fr auto;align-items:end}
  .site-foot .lead,.site-foot .foot-copy{grid-column:1/-1}
}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
@media print{
  :root,:root[data-theme="dark"]{--bg:#fff;--surface:#fff;--border:#ccc;--text:#000;--text2:#444;--disabled:#666;--accent:#000;--accent-muted:#fff;--emoji-bg:#f2f2f2;--track:#ddd;color-scheme:light}
  .bar-right,.site-foot .foot-links{display:none!important}
}
`;

/* Görünüm seçimi ilk boyamadan önce uygulanır: gece açılan sayfa bir an bile parlamaz. */
const THEME_BOOT = "(function(){try{var m=localStorage.getItem('listem-theme');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();";
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

function lockupSvg() {
  return '<svg viewBox="180 180 640 660" aria-hidden="true"><path d="' + LOGO_PATH + '"/></svg>';
}

/* Başlık: solda tek renk marka, sağda menü, dil ve görünüm. current: 'season' | null */
function header(lang, langHref, current) {
  const t = SITE[lang];
  const homeHref = lang === 'en' ? '/?lang=en' : '/';
  const seasonHref = '/mevsim' + (lang === 'en' ? '?lang=en' : '');
  return '<header class="bar">' +
    '<a class="lockup" href="' + homeHref + '" aria-label="List-em, ' + esc(t.home) + '">' + lockupSvg() + '<span class="wordmark">List-em</span></a>' +
    '<div class="bar-right">' +
    '<nav class="nav" aria-label="List-em"><a href="' + seasonHref + '"' + (current === 'season' ? ' aria-current="page"' : '') + '>' + esc(t.nav.season) + '</a></nav>' +
    '<a class="tool lang" href="' + esc(langHref) + '" hreflang="' + (lang === 'tr' ? 'en' : 'tr') + '" aria-label="' + esc(t.otherLangLabel) + '">' + t.otherLang + '</a>' +
    '<button type="button" class="tool" id="theme" aria-label="' + esc(t.themeSystem) + '" data-icons="' + esc(JSON.stringify(ICON)) + '" data-labels="' + esc(JSON.stringify({ system: t.themeSystem, light: t.themeLight, dark: t.themeDark })) + '">' + ICON.system + '</button>' +
    '</div></header>';
}

/* Alt bilgi. lead: sayfaya özel ilk satır (HTML, çağıran kaçışlar). */
function footer(lang, lead) {
  const t = SITE[lang];
  const q = lang === 'en' ? '?lang=en' : '';
  return '<footer class="site-foot">' +
    (lead ? '<p class="lead" style="margin:0">' + lead + '</p>' : '') +
    '<div><a class="foot-brand" href="/' + q + '">' + lockupSvg() + '<span class="wordmark">List-em</span></a>' +
    '<p class="foot-tag" style="margin:6px 0 0">' + esc(t.tagline) + '</p></div>' +
    '<nav class="foot-links" aria-label="' + esc(t.contact) + '">' +
    '<a href="/mevsim' + q + '">' + esc(t.nav.season) + '</a>' +
    '<a href="/gizlilik">' + esc(t.privacy) + '</a>' +
    '<a href="/kosullar">' + esc(t.terms) + '</a>' +
    '<a href="mailto:contact@list-em.app">' + esc(t.contact) + '</a>' +
    '<a href="https://www.instagram.com/listem.app/" target="_blank" rel="noopener noreferrer">Instagram</a>' +
    '<a href="https://x.com/listemapp" target="_blank" rel="noopener noreferrer">X</a>' +
    '</nav>' +
    '<p class="foot-copy" style="margin:0">© ' + new Date().getFullYear() + ' List-em</p>' +
    '</footer>';
}

/**
 * pageShell({ lang, title, description, ogTitle, ogDescription, host, css, body, scripts, index })
 *   css     — sayfaya özel stil
 *   scripts — sayfaya özel betik(ler), <script> etiketleriyle birlikte
 *   index   — arama motorları dizinlesin mi (paylaşılan listeler: hayır)
 */
function pageShell(o) {
  const host = o.host || 'list-em.app';
  return '<!doctype html>\n<html lang="' + o.lang + '">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="color-scheme" content="light dark">\n' +
    '<meta name="theme-color" content="#F8F7F4" media="(prefers-color-scheme: light)">\n' +
    '<meta name="theme-color" content="#121210" media="(prefers-color-scheme: dark)">\n' +
    '<script>' + THEME_BOOT + '</script>\n' +
    '<title>' + esc(o.title) + '</title>\n' +
    (o.description ? '<meta name="description" content="' + esc(o.description) + '">\n' : '') +
    '<meta property="og:title" content="' + esc(o.ogTitle || o.title) + '">\n' +
    '<meta property="og:description" content="' + esc(o.ogDescription || o.description || '') + '">\n' +
    '<meta property="og:image" content="https://' + esc(host) + '/og-image.png">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    (o.index ? '' : '<meta name="robots" content="noindex">\n') +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
    '<link rel="preload" href="/fonts/fraunces-latin-soft-normal.woff2" as="font" type="font/woff2" crossorigin>\n' +
    '<style>' + FONT_CSS + TOKENS_CSS + BASE_CSS + (o.css || '') + '</style>\n' +
    '</head>\n<body' + (o.bodyClass ? ' class="' + o.bodyClass + '"' : '') + '>\n' + o.body + '\n' +
    '<script>' + THEME_JS + '</script>\n' +
    (o.scripts || '') +
    '</body>\n</html>';
}

module.exports = { LOGO_PATH, SITE, SOCIAL, esc, header, footer, pageShell };
