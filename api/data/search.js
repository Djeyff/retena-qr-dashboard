const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { query } = req.body || {};
    if (!query || query.length < 2) return res.json({ results: [] });

    const q = query.trim();
    // Keyword search across messages and transcriptions
    const [msgResults, transcriptResults] = await Promise.all([
      supabase(`rewa_messages?or=(body.ilike.*${encodeURIComponent(q)}*,text_content.ilike.*${encodeURIComponent(q)}*)&order=timestamp.desc&limit=20&select=*`),
      supabase(`rewa_transcriptions?transcription=ilike.*${encodeURIComponent(q)}*&order=created_at.desc&limit=20&select=*`).catch(() => []),
    ]);

    const results = [
      ...(msgResults || []).map(r => ({ ...r, _source: 'message' })),
      ...(transcriptResults || []).map(r => ({ ...r, _source: 'transcript' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);

    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
