const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { group, type, limit = 100, offset = 0 } = req.query;
    const OWNER = process.env.OWNER_NUMBER || '18092044903';
    // Exclude incoming messages from owner's own number (e.g. bot replies)
    // Keep from_me=true (outgoing) and all non-owner messages
    let qs = `order=timestamp.desc&limit=${Math.min(Number(limit), 200)}&offset=${Number(offset)}&select=*&or=(from_me.eq.true,sender_id.not.ilike.*${OWNER}*)`;
    if (group) qs += `&group_id=eq.${group}`;
    if (type && type !== 'all') qs += `&message_type=eq.${type}`;
    const rows = await supabase(`rewa_messages?${qs}`);
    res.json(rows || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
