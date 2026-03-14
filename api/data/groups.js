const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const groups = await supabase('rewa_groups?order=last_message_at.desc.nullsfirst&limit=50&select=*');
    res.json(groups || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
