const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { limit = 500, chat } = req.query;

    // Query with all needed fields including chat_id and from_me
    let qs = `select=id,chat_id,chat_name,sender_id,sender_name,from_me,is_group,message_type,body,transcription,media_caption,summary,duration_seconds,language,has_media,timestamp,created_at&is_group=eq.false&chat_id=neq.status@broadcast&order=timestamp.desc&limit=${Math.min(Number(limit), 1000)}`;

    if (chat) {
      qs += `&chat_id=eq.${chat}`;
    }

    const rows = await supabase(`rewa_messages?${qs}`);

    // Build conversation map
    const convMap = {};
    for (const msg of rows) {
      const cid = msg.chat_id;
      if (!cid) continue;
      if (!convMap[cid]) {
        convMap[cid] = {
          chat_id: cid,
          contact_name: null,
          last_message: msg,
          message_count: 0,
          voice_count: 0,
          text_count: 0,
        };
      }
      if (!msg.from_me && msg.sender_name) {
        convMap[cid].contact_name = msg.sender_name;
      }
      convMap[cid].message_count++;
      if (msg.message_type === 'voice' || msg.message_type === 'audio') convMap[cid].voice_count++;
      else convMap[cid].text_count++;
    }

    // Resolve missing contact names from chat_id
    for (const conv of Object.values(convMap)) {
      if (!conv.contact_name) {
        const phone = conv.chat_id.replace(/@.*/, '');
        conv.contact_name = phone;
      }
    }

    const conversations = Object.values(convMap).sort(
      (a, b) => new Date(b.last_message.timestamp || b.last_message.created_at) -
                new Date(a.last_message.timestamp || a.last_message.created_at)
    );

    res.json({ items: rows, conversations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
