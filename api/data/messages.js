const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { group, type, limit = 100, offset = 0 } = req.query;
    let qs = `order=created_at.desc&limit=${Math.min(Number(limit), 200)}&offset=${Number(offset)}&select=*`;
    if (group) qs += `&group_id=eq.${group}`;
    if (type && type !== 'all') qs += `&message_type=eq.${type}`;
    const rows = await supabase(`rewa_messages?${qs}`);
    res.json(rows || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
