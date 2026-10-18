'use strict';
/*
 * Ana sayfa (list-em.app) — geçici, sade "çok yakında" sayfası. Gerçek ana sayfa site turunda
 * gelene kadar paylaşım sayfasındaki marka bağlantısı ve sosyal medya profilleri boş bir
 * hataya düşmesin diye. Söz önce gelir; reyon sırası tek başına öne çıkarılmaz.
 */
const site = require('./_site');
const { esc } = site;

const T = {
  tr: {
    eyebrow: 'Çok yakında App Store’da',
    title: 'Türkiye’ye özel market alışveriş listesi',
    body: 'Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilen; markette reyon sırasına dizilen; uygulaması olmayanın da açabildiği bir alışveriş listesi.',
    ig: 'Instagram’da takip et', x: 'X’te takip et',
    season: 'Ya da Mevsim Takvimi’ne göz at',
    meta: 'List-em: Türkiye’ye özel market alışveriş listesi. Ürünleri gramıyla, kalorisiyle ve mevsimiyle bilir. Çok yakında App Store’da.',
  },
  en: {
    eyebrow: 'Coming soon to the App Store',
    title: 'A grocery list made for Turkey',
    body: 'It knows products by weight, calories and season; it puts your list in aisle order; and anyone can open a shared list without the app.',
    ig: 'Follow on Instagram', x: 'Follow on X',
    season: 'Or browse the Seasonal Calendar',
    meta: 'List-em: a grocery list made for Turkey. It knows products by weight, calories and season. Coming soon to the App Store.',
  },
};

const CSS = `
.hold{position:relative;min-height:calc(100svh - 56px - 160px)}
.hold-in{max-width:620px;padding:12vh 0 0}
.eyebrow{margin:0;display:inline-flex;align-items:center;gap:8px;min-height:28px;padding:0 12px;border-radius:999px;background:var(--accent-muted);color:var(--accent);font-size:13px;font-weight:600}
.hold h1{margin:18px 0 0;font-family:var(--serif);font-variation-settings:"SOFT" 100;font-weight:600;font-size:40px;line-height:1.05;letter-spacing:-.02em}
.hold p.body{margin:16px 0 0;font-size:17px;line-height:1.5;color:var(--text2)}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;border-radius:12px;font-size:16px;font-weight:600;text-decoration:none}
.btn.primary{background:var(--accent);color:#fff}
.btn.secondary{border:.5px solid var(--border);background:var(--surface);color:var(--text)}
.btn:active{opacity:.6}
.more{display:inline-flex;align-items:center;min-height:44px;margin-top:14px;color:var(--accent);font-weight:600;text-decoration:none}
@media (min-width:900px){.hold-in{padding-top:16vh}.hold h1{font-size:60px}.hold p.body{font-size:19px}}
`;

function render(lang, host) {
  const t = T[lang];
  const q = lang === 'en' ? '?lang=en' : '';
  const body = '<div class="wrap">' + site.header(lang, '/?lang=' + (lang === 'tr' ? 'en' : 'tr'), null) +
    '<main class="hold"><div class="hold-in">' +
    '<p class="eyebrow">' + esc(t.eyebrow) + '</p>' +
    '<h1>' + esc(t.title) + '</h1>' +
    '<p class="body">' + esc(t.body) + '</p>' +
    '<div class="cta"><a class="btn primary" href="https://www.instagram.com/listem.app/" rel="noopener">' + esc(t.ig) + '</a>' +
    '<a class="btn secondary" href="https://x.com/listemapp" rel="noopener">' + esc(t.x) + '</a></div>' +
    '<a class="more" href="/mevsim' + q + '">' + esc(t.season) + ' →</a>' +
    '</div></main>' + site.footer(lang, '') + '</div>';
  return site.pageShell({ lang, title: 'List-em · ' + t.title, description: t.meta, ogTitle: 'List-em', ogDescription: t.meta, host, css: CSS, body, index: true });
}

module.exports = (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(lang, req.headers.host || 'list-em.app'));
};
module.exports.render = render;
