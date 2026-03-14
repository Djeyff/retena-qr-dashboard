module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, lang = 'en' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not set' });

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: `Translate the following text to ${lang}. Return ONLY the translation, no explanation.` },
          { role: 'user', content: text }
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });
    const d = await r.json();
    const translated = d.choices?.[0]?.message?.content?.trim();
    if (!translated) throw new Error('No translation returned');
    res.json({ translated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
