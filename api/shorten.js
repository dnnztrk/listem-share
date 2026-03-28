const { kv } = require('@vercel/kv');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data } = req.body || {};

  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "data" field' });
  }

  const id = crypto.randomBytes(6).toString('base64url').slice(0, 8);
  await kv.set(`share:${id}`, data);

  const host = req.headers.host || 'list-em.app';
  const shortUrl = `https://${host}/s/${id}`;

  res.status(200).json({ id, url: shortUrl });
};
