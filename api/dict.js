module.exports = async (req, res) => {
  const GAS_URL = process.env.GAS_URL;
  const GAS_TOKEN = process.env.GAS_TOKEN || '';

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (!GAS_URL) {
    res.status(500).send('Proxy error: GAS_URL env is missing');
    return;
  }

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${GAS_URL}?t=${encodeURIComponent(GAS_TOKEN)}`);
      const ct = r.headers.get('content-type') || '';
      if (!r.ok) {
        const txt = await r.text();
        return res.status(502).send('Upstream error: ' + txt);
      }
      if (ct.includes('application/json')) {
        const data = await r.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json(data);
      } else {
        const txt = await r.text();
        return res.status(502).send('Upstream not JSON: ' + txt.slice(0, 200));
      }
    }

    if (req.method === 'POST') {
      const r = await fetch(`${GAS_URL}?t=${encodeURIComponent(GAS_TOKEN)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      const txt = await r.text(); 
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(r.ok ? 200 : 400).send(txt);
    }

    return res.status(405).send('Method Not Allowed');
  } catch (e) {
    return res.status(500).send('Proxy error: ' + (e && e.message ? e.message : String(e)));
  }
};

