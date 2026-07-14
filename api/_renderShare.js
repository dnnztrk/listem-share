const LZString = require('lz-string');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderShareHTML(data, host) {
  let listName = '';
  let listIcon = '🛒';
  let itemCount = 0;
  let lang = 'tr';
  let items = [];

  if (data) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        listName = parsed.name || '';
        listIcon = parsed.icon || listIcon;
        lang = parsed.lang || 'tr';
        items = Array.isArray(parsed.items) ? parsed.items : [];
        itemCount = items.length;
      }
    } catch (e) {}
  }

  if (!listName) listName = lang === 'tr' ? 'Alışveriş Listesi' : 'Shopping List';

  const caption = lang === 'tr'
    ? itemCount + ' ürün · seninle paylaşıldı'
    : itemCount + ' items · shared with you';

  const ogDescription = lang === 'tr'
    ? '"' + listName + '" listesi' + (itemCount > 0 ? ' (' + itemCount + ' ürün)' : '') + ' seninle paylaşıldı'
    : '"' + listName + '" list' + (itemCount > 0 ? ' (' + itemCount + ' items)' : '') + ' shared with you';

  const btnOpen = lang === 'tr' ? "List-em'de Aç" : 'Open in List-em';
  const btnDownload = lang === 'tr' ? "App Store'dan İndir" : 'Get List-em';
  const tagline = lang === 'tr' ? "Türkiye'nin alışveriş listesi" : "Turkey's grocery list";
  const sectionLabel = lang === 'tr' ? 'ÜRÜNLER' : 'PRODUCTS';

  const deepLink = 'listem://share?data=' + (data || '');
  const appStoreLink = 'https://apps.apple.com/app/list-em/id0000000000';

  const namedItems = items.filter((item) => item && item.name);

  const escListName = escapeHtml(listName);
  const escListIcon = escapeHtml(listIcon);
  const escOgDescription = escapeHtml(ogDescription);
  const ogTitle = escListIcon + ' ' + escListName + (itemCount > 0 ? ' (' + itemCount + (lang === 'tr' ? ' ürün)' : ' items)') : '');

  let productCardHtml = '';
  if (namedItems.length > 0) {
    const rows = namedItems.map((item) => {
      const escName = escapeHtml(item.name);
      const qty = Number(item.qty);
      const badge = qty > 1 ? '<span class="qty-badge">×' + escapeHtml(String(qty)) + '</span>' : '';
      return '<div class="item-row"><span class="item-dot"></span><div class="item-content"><span class="item-name">' + escName + '</span>' + badge + '</div></div>';
    }).join('');

    productCardHtml = '<div class="product-card"><div class="section-label">' + escapeHtml(sectionLabel) + '</div>' + rows + '</div>';
  }

  return '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="og:title" content="' + ogTitle + '"><meta property="og:description" content="' + escOgDescription + '"><meta property="og:type" content="website"><meta property="og:image" content="https://' + host + '/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + ogTitle + '"><meta name="twitter:description" content="' + escOgDescription + '"><meta name="twitter:image" content="https://' + host + '/og-image.png"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><title>' + escListName + ' — List-em</title><style>' +
    ':root{--bg:#F4F2ED;--card:#FFFFFF;--text:#1B221E;--text-secondary:#6B7570;--text-faint:#8A948E;--border:#E5E8E3;--divider:#ECEFE9;--accent:#2D8B75;--badge-bg:rgba(45,139,117,.12);--badge-text:#1F6A57}' +
    '@media (prefers-color-scheme:dark){:root{--bg:#141816;--card:#1C211E;--text:#ECEFEA;--text-secondary:#9AA49D;--text-faint:#6E7871;--border:#2A302C;--divider:#232925;--accent:#3AA98F;--badge-bg:rgba(58,169,143,.16);--badge-text:#7FD4BC}}' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:var(--bg);color:var(--text);display:flex;justify-content:center;min-height:100vh;padding:32px 20px}' +
    '.page{max-width:420px;width:100%;margin:0 auto;display:flex;flex-direction:column;align-items:center}' +
    '.icon-circle{width:56px;height:56px;border-radius:50%;background:var(--badge-bg);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px}' +
    'h1{font-size:28px;font-weight:700;text-align:center;margin-bottom:6px}' +
    '.caption{font-size:13px;font-weight:500;color:var(--text-secondary);text-align:center;margin-bottom:28px}' +
    '.product-card{background:var(--card);border:1px solid var(--border);border-radius:20px;width:100%;margin-bottom:28px;overflow:hidden}' +
    '.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-secondary);padding:16px 16px 8px}' +
    '.item-row{display:flex;align-items:center;min-height:46px;padding:0 16px}' +
    '.item-content{display:flex;align-items:center;flex:1;min-height:46px;border-top:1px solid var(--divider)}' +
    '.item-row:first-of-type .item-content{border-top:none}' +
    '.item-dot{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--border);margin-right:16px;flex-shrink:0}' +
    '.item-name{font-size:15px;font-weight:400;flex:1}' +
    '.qty-badge{font-size:12px;font-weight:600;color:var(--badge-text);background:var(--badge-bg);padding:2px 10px;border-radius:100px;margin-left:8px}' +
    '.cta{width:100%}' +
    '.btn{display:block;background:var(--accent);color:white;text-decoration:none;height:50px;line-height:50px;text-align:center;border-radius:14px;font-size:16px;font-weight:600;margin-bottom:12px}' +
    '.btn-secondary{display:block;color:var(--accent);text-decoration:none;font-size:13px;font-weight:500;text-align:center}' +
    '.logo{margin-top:28px;display:flex;align-items:center;justify-content:center;gap:8px}' +
    '.logo img{width:32px;height:32px;border-radius:8px}' +
    '.logo span{font-size:14px;color:var(--text-faint);font-weight:500}' +
    '</style></head><body><div class="page">' +
    '<div class="icon-circle">' + escListIcon + '</div>' +
    '<h1>' + escListName + '</h1>' +
    '<p class="caption">' + escapeHtml(caption) + '</p>' +
    productCardHtml +
    '<div class="cta"><a href="' + deepLink + '" class="btn" id="openApp">' + btnOpen + '</a><a href="' + appStoreLink + '" class="btn-secondary">' + btnDownload + '</a></div>' +
    '<div class="logo"><img src="/icon.png.png" alt="List-em"><span>List-em — ' + tagline + '</span></div>' +
    '</div><script>document.getElementById("openApp").addEventListener("click",function(e){e.preventDefault();window.location.href="' + deepLink + '";setTimeout(function(){window.location.href="' + appStoreLink + '"},1500)})</script></body></html>';
}

module.exports = renderShareHTML;
