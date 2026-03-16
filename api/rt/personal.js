const { supabase } = require('./_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { limit = 500, chat } = req.query;
    const OWNER = process.env.OWNER_NUMBER || '18092044903';

    // Build query — personal (non-group) messages, exclude status@broadcast
    let qs = `select=id,chat_id,chat_name,sender_id,sender_name,from_me,message_type,body,content,transcription,text,summary,duration,duration_seconds,language,has_media,media_caption,timestamp,created_at&is_group=eq.false&chat_id=neq.status@broadcast&order=timestamp.desc&limit=${Math.min(Number(limit), 1000)}`;

    // If specific chat requested, filter by chat_id
    if (chat) {
      qs += `&chat_id=eq.${chat}`;
    }

    const rows = await supabase(`rewa_messages?${qs}`);

    // Build conversation map for the sidebar
    const conversations = {};
    for (const msg of rows) {
      const cid = msg.chat_id;
      if (!conversations[cid]) {
        // Determine contact name (non-owner sender)
        const contactName = msg.from_me
          ? null
          : (msg.sender_name || msg.sender_id || 'Unknown');
        conversations[cid] = {
          chat_id: cid,
          contact_name: contactName,
          last_message: msg,
          message_count: 0,
          voice_count: 0,
          text_count: 0,
        };
      }
      // Fill in contact name from non-owner messages
      if (!msg.from_me && !conversations[cid].contact_name) {
        conversations[cid].contact_name = msg.sender_name || msg.sender_id || 'Unknown';
      }
      conversations[cid].message_count++;
      const isVoice = msg.message_type === 'voice' || msg.message_type === 'audio';
      if (isVoice) conversations[cid].voice_count++;
      else conversations[cid].text_count++;
    }

    // For conversations where we only have from_me messages (owner talking to self?),
    // try to resolve the contact name from the chat_id
    for (const conv of Object.values(conversations)) {
      if (!conv.contact_name) {
        // Extract phone from chat_id like "18492588456@c.us"
        const phone = conv.chat_id.replace(/@.*/, '');
        conv.contact_name = phone === OWNER ? 'Me (Notes)' : phone;
      }
    }

    res.json({
      items: rows,
      conversations: Object.values(conversations).sort(
        (a, b) => new Date(b.last_message.timestamp || b.last_message.created_at) - new Date(a.last_message.timestamp || a.last_message.created_at)
      ),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
