const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [messages, voiceNotes, groups, transcripts, todayMsgs] = await Promise.all([
      supabase('rewa_messages?select=count', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        .catch(() => null),
      supabase(`rewa_messages?message_type=eq.voice&select=count`, { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        .catch(() => null),
      supabase('rewa_groups?select=count', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        .catch(() => null),
      supabase('rewa_transcriptions?select=count', { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        .catch(() => null),
      supabase(`rewa_messages?created_at=gte.${todayISO}&select=count`, { headers: { 'Prefer': 'count=exact', 'Range': '0-0' } })
        .catch(() => null),
    ]);

    // Supabase count comes in Content-Range header — parse from result length fallback
    // Use array length as count since we're getting rows
    const countRows = async (table, filter = '') => {
      try {
        const rows = await supabase(`${table}?${filter}select=id`);
        return Array.isArray(rows) ? rows.length : 0;
      } catch { return 0; }
    };

    const [totalMessages, totalVoice, totalGroups, totalTranscripts, todayMessages] = await Promise.all([
      countRows('rewa_messages'),
      countRows('rewa_messages', 'message_type=eq.voice&'),
      countRows('rewa_groups'),
      countRows('rewa_transcriptions'),
      countRows('rewa_messages', `created_at=gte.${todayISO}&`),
    ]);

    res.json({
      totalMessages,
      totalVoice,
      totalGroups,
      totalTranscripts,
      todayMessages,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
