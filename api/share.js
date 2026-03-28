const renderShareHTML = require('./_renderShare');

module.exports = (req, res) => {
  const { data } = req.query;
  const host = req.headers.host || 'list-em.app';
  const html = renderShareHTML(data, host);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(html);
};
