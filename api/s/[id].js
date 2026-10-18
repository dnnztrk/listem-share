const { kv } = require('@vercel/kv');
const render = require('../_renderShare');

module.exports = async (req, res) => {
  const { id } = req.query;
  const host = req.headers.host || 'list-em.app';
  const lang = req.query.lang;

  let data;
  try {
    data = await kv.get(`share:${id}`);
  } catch (e) {
    // "Yok" değil "bakamadık": bağlantı geçerli olabilir, yeniden denenebilir.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send(render.renderUnavailableHTML(host, { lang }));
  }

  if (!data) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).send(render.renderExpiredHTML(host, { lang }));
  }

  let ttlSeconds;
  try { ttlSeconds = await kv.ttl(`share:${id}`); } catch (e) {}

  const url = `https://${host}/s/${id}`;
  const qrSvg = await render.qrSvgFor(url);
  const html = render.renderShareHTML(data, host, { id, url, lang, ttlSeconds, qrSvg, langBase: `/s/${id}?` });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Kalan gün sayısı sayfada yazdığı için kısa önbellek.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  res.status(200).send(html);
};
