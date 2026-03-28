const { kv } = require('@vercel/kv');
const renderShareHTML = require('../_renderShare');

module.exports = async (req, res) => {
  const { id } = req.query;

  const data = await kv.get(`share:${id}`);

  if (!data) {
    return res.status(404).send('List not found');
  }

  const host = req.headers.host || 'list-em.app';
  const html = renderShareHTML(data, host);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(html);
};
