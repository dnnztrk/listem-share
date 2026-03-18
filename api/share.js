const LZString = require('lz-string');

module.exports = (req, res) => {
  const { data } = req.query;
  
  let listName = 'Alışveriş Listesi';
  let listIcon = '🛒';
  let itemCount = '';
  let description = 'List-em ile paylaşılan bir alışveriş listesi';
  
  if (data) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        const parsed = JSON.parse(decompressed);
        listName = parsed.name || listName;
        listIcon = parsed.icon || listIcon;
        const count = parsed.items?.length || 0;
        itemCount = count > 0 ? ' (' + count + ' ürün)' : '';
        description = '"' + listName + '" listesi' + itemCount + ' seninle paylaşıldı';
      }
    } catch (e) {}
  }
  
  const deepLink = 'listem://share?data=' + (data || '');
  const appStoreLink = 'https://apps.apple.com/app/list-em/id0000000000';
  const host = req.headers.host || 'list-em.app';
  
  const html = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta property="og:title" content="' + listIcon + ' ' + listName + itemCount + '"><meta property="og:description" content="' + description + '"><meta property="og:type" content="website"><meta property="og:image" content="https://' + host + '/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + listIcon + ' ' + listName + itemCount + '"><meta name="twitter:description" content="' + description + '"><meta name="twitter:image" content="https://' + host + '/og-image.png"><title>' + listName + ' — List-em</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F7F4;color:#1E1E1C;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px}.card{background:white;border-radius:20px;padding:40px 32px;max-width:380px;width:100%;text-align:center;box-shadow:0 2px 20px rgba(0,0,0,0.08)}.icon{font-size:48px;margin-bottom:16px}h1{font-size:24px;font-weight:600;margin-bottom:8px}.subtitle{font-size:16px;color:#666;margin-bottom:24px}.btn{display:block;background:#2D8B75;color:white;text-decoration:none;padding:16px 32px;border-radius:14px;font-size:17px;font-weight:600;margin-bottom:12px}.btn-secondary{display:block;color:#2D8B75;text-decoration:none;font-size:15px;font-weight:500}.logo{margin-top:24px;display:flex;align-items:center;justify-content:center;gap:8px}.logo img{width:32px;height:32px;border-radius:8px}.logo span{font-size:14px;color:#999;font-weight:500}</style></head><body><div class="card"><div class="icon">' + listIcon + '</div><h1>' + listName + '</h1><p class="subtitle">' + description + '</p><a href="' + deepLink + '" class="btn" id="openApp">List-em\'de Aç</a><a href="' + appStoreLink + '" class="btn-secondary">List-em\'i İndir</a><div class="logo"><img src="/icon.png.png" alt="List-em"><span>List-em</span></div></div><script>document.getElementById("openApp").addEventListener("click",function(e){e.preventDefault();window.location.href="' + deepLink + '";setTimeout(function(){window.location.href="' + appStoreLink + '"},1500)})</script></body></html>';
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(html);
};
