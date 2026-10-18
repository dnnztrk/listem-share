const render = require('./_renderShare');

module.exports = async (req, res) => {
  const { data, lang } = req.query;
  const host = req.headers.host || 'list-em.app';
  const url = `https://${host}/share?data=${encodeURIComponent(data || '')}`;
  const qrSvg = await render.qrSvgFor(url);
  const html = render.renderShareHTML(data, host, { url, lang, qrSvg });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(html);
};
