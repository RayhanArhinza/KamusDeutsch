
export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL;
  const GAS_TOKEN = process.env.GAS_TOKEN; // optional

  try {
    const method = req.method;

    // Teruskan GET (list) ke GAS
    if (method === 'GET') {
      const r = await fetch(`${GAS_URL}?t=${encodeURIComponent(GAS_TOKEN || '')}`);
      const data = await r.json();
      // CORS untuk dipanggil dari browser
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json(data);
      return;
    }

    // Teruskan POST (create/update/delete) ke GAS
    if (method === 'POST') {
      const r = await fetch(`${GAS_URL}?t=${encodeURIComponent(GAS_TOKEN || '')}`, {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' },
      });
      const text = await r.text(); // GAS kamu balas "Success", "Updated", "Deleted"
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(r.ok ? 200 : 400).send(text);
      return;
    }

    // Preflight CORS
    if (method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).end();
      return;
    }

    res.status(405).send('Method Not Allowed');
  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
}

