const LZString = require('lz-string');

function renderShareHTML(data, host) {
  let listName = '';
  let listIcon = '🛒';
  let itemCount = '';
  let lang = 'tr';
  let description = '';

  if (data) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        listName = parsed.name || '';
        listIcon = parsed.icon || listIcon;
        lang = parsed.lang || 'tr';
        const count = parsed.items?.length || 0;
        itemCount = count > 0 ? ' (' + count + (lang === 'tr' ? ' ürün)' : ' items)') : '';
      }
    } catch (e) {}
  }

  if (!listName) listName = lang === 'tr' ? 'Alışveriş Listesi' : 'Shopping List';
  if (!description) description = lang === 'tr'
    ? '"' + listName + '" listesi' + itemCount + ' seninle paylaşıldı'
    : '"' + listName + '" list' + itemCount + ' shared with you';

  const btnOpen = lang === 'tr' ? "List-em'de Aç" : 'Open in List-em';
  const btnDownload = lang === 'tr' ? "List-em'i İndir" : 'Download List-em';
  const tagline = lang === 'tr' ? "Türkiye'nin alışveriş listesi" : "Turkey's grocery list";

  const deepLink = 'listem://share?data=' + (data || '');
  const appStoreLink = 'https://apps.apple.com/app/list-em/id0000000000';

  return '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="og:title" content="' + listIcon + ' ' + listName + itemCount + '"><meta property="og:description" content="' + description + '"><meta property="og:type" content="website"><meta property="og:image" content="https://' + host + '/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + listIcon + ' ' + listName + itemCount + '"><meta name="twitter:description" content="' + description + '"><meta name="twitter:image" content="https://' + host + '/og-image.png"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><title>' + listName + ' — List-em</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F7F4;color:#1E1E1C;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px}.card{background:white;border-radius:20px;padding:40px 32px;max-width:380px;width:100%;text-align:center;box-shadow:0 2px 20px rgba(0,0,0,0.08)}.icon{font-size:48px;margin-bottom:16px}h1{font-size:24px;font-weight:600;margin-bottom:8px}.subtitle{font-size:16px;color:#666;margin-bottom:24px}.btn{display:block;background:#2D8B75;color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:17px;font-weight:600;margin-bottom:12px}.btn-secondary{display:block;color:#2D8B75;text-decoration:none;font-size:15px;font-weight:500}.logo{margin-top:24px;display:flex;align-items:center;justify-content:center;gap:8px}.logo img{width:32px;height:32px;border-radius:8px}.logo span{font-size:14px;color:#999;font-weight:500}</style></head><body><div class="card"><div class="icon">' + listIcon + '</div><h1>' + listName + '</h1><p class="subtitle">' + description + '</p><a href="' + deepLink + '" class="btn" id="openApp">' + btnOpen + '</a><a href="' + appStoreLink + '" class="btn-secondary">' + btnDownload + '</a><div class="logo"><img src="/icon.png.png" alt="List-em"><span>List-em — ' + tagline + '</span></div></div><script>document.getElementById("openApp").addEventListener("click",function(e){e.preventDefault();window.location.href="' + deepLink + '";setTimeout(function(){window.location.href="' + appStoreLink + '"},1500)})</script></body></html>';
}

module.exports = renderShareHTML;
