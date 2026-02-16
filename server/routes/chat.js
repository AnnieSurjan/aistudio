const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { getAdminClient } = require('../lib/supabase');

let ai = null;
function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const SYSTEM_INSTRUCTION = `
You are Dup-Detect AI, a specialized assistant for a QuickBooks/Xero duplicate detection tool.
Your capabilities:
1. Explain how duplicates were detected (Same date/amount, fuzzy matching, same memo).
2. Advise on safe deletion practices (e.g., "Check if the transaction is reconciled first").
3. Help with app navigation (Dashboard, Scan, Settings, Connections).
4. Provide accounting context regarding duplicates in Invoices, Bills, Journal Entries.
5. Help troubleshoot QuickBooks and Xero connection issues.

Tone: Professional, helpful, concise, and accounting-aware.
Assume the user is using the 'Dup-Detect' web app.
`;

// POST /api/chat/message - Send a message and get AI response
router.post('/message', async (req, res) => {
  try {
    const { sessionId, message, source } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const supabase = getAdminClient();
    let currentSessionId = sessionId;

    // Create new session if none provided
    if (!currentSessionId) {
      // Use the first ~50 chars of the message as the session title
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;

      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title,
          source: source || 'assistant',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      currentSessionId = session.id;
    }

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        text: message.trim(),
      });

    if (userMsgError) throw userMsgError;

    // Load full conversation history for this session
    const { data: history, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, text')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // Build multi-turn contents for Gemini
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // Call Gemini with proper multi-turn conversation
    const response = await getAI().models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const aiText = response.text || "I'm sorry, I couldn't process that request.";

    // Save AI response
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'model',
        text: aiText,
      })
      .select()
      .single();

    if (aiMsgError) throw aiMsgError;

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    res.json({
      sessionId: currentSessionId,
      message: {
        id: aiMsg.id,
        role: 'model',
        text: aiText,
        created_at: aiMsg.created_at,
      },
    });
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/chat/sessions - List user's chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const userId = req.user.id;
    const source = req.query.source || 'assistant';
    const supabase = getAdminClient();

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('id, title, source, created_at, updated_at')
      .eq('user_id', userId)
      .eq('source', source)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('[Chat] Sessions list error:', error.message);
    res.status(500).json({ error: 'Failed to load chat sessions' });
  }
});

// GET /api/chat/sessions/:id - Get messages for a session
router.get('/sessions/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const supabase = getAdminClient();

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, role, text, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({ session, messages: messages || [] });
  } catch (error) {
    console.error('[Chat] Session detail error:', error.message);
    res.status(500).json({ error: 'Failed to load chat session' });
  }
});

// DELETE /api/chat/sessions/:id - Delete a chat session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[Chat] Delete session error:', error.message);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

module.exports = router;
