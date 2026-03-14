const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // All counts from rewa_messages (source of truth for QR backend)
    const [allMsgs, voiceMsgs, todayMsgs, transcribedMsgs, durationData] = await Promise.all([
      supabase('rewa_messages?select=id'),
      supabase('rewa_messages?message_type=eq.voice&select=id'),
      supabase(`rewa_messages?timestamp=gte.${todayISO}&select=id`),
      supabase('rewa_messages?transcription=not.is.null&select=id,duration_seconds'),
      supabase('rewa_messages?transcription=not.is.null&select=duration_seconds'),
    ]);

    // Distinct groups from chat_id column
    const groupsRaw = await supabase('rewa_messages?select=chat_id').catch(() => []);
    const uniqueGroups = new Set((Array.isArray(groupsRaw) ? groupsRaw : []).map(r => r.chat_id).filter(Boolean));

    // Total minutes transcribed
    const totalSeconds = (Array.isArray(durationData) ? durationData : [])
      .reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60 * 10) / 10;

    res.json({
      totalMessages:   Array.isArray(allMsgs) ? allMsgs.length : 0,
      totalVoice:      Array.isArray(voiceMsgs) ? voiceMsgs.length : 0,
      totalGroups:     uniqueGroups.size,
      totalTranscripts:Array.isArray(transcribedMsgs) ? transcribedMsgs.length : 0,
      todayMessages:   Array.isArray(todayMsgs) ? todayMsgs.length : 0,
      totalMinutes,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
