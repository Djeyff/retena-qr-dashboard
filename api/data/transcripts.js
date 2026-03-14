const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { group, limit = 50, offset = 0 } = req.query;
    let qs = `order=created_at.desc&limit=${Math.min(Number(limit), 100)}&offset=${Number(offset)}&select=*`;
    if (group) qs += `&group_id=eq.${group}`;
    const rows = await supabase(`rewa_transcriptions?${qs}`);
    res.json(rows || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
