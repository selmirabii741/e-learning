/**
 * llmProvider.js — Clean LLM provider with Groq → OpenAI → Gemini fallback chain.
 *
 * Extracted from tutorService.js but kept as a standalone module.
 * The original aiChat() in tutorService.js is preserved for backward compatibility.
 */

/**
 * Call Groq LLM.
 */
async function groqChat(systemPrompt, userMessage) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY manquant');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Call OpenAI LLM.
 */
async function openaiChat(systemPrompt, userMessage) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY manquant');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Call Gemini LLM.
 */
async function geminiChat(systemPrompt, userMessage, retries = 1) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY manquant');

  const fullMessage = systemPrompt
    ? `${systemPrompt}\n\n---\n\nQuestion : ${userMessage}`
    : userMessage;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullMessage }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini HTTP ${res.status}`;
    if (res.status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, 20000));
      return geminiChat(systemPrompt, userMessage, retries - 1);
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate an answer using the provider fallback chain: Groq → OpenAI → Gemini.
 *
 * @param {string} systemPrompt - System-level prompt
 * @param {string} userPrompt - User message / question
 * @returns {Promise<{ answer: string, provider: string }>}
 */
export async function generateAnswer(systemPrompt, userPrompt) {
  const providers = [
    { name: 'Groq', fn: () => groqChat(systemPrompt, userPrompt), enabled: !!process.env.GROQ_API_KEY },
    { name: 'OpenAI', fn: () => openaiChat(systemPrompt, userPrompt), enabled: !!process.env.OPENAI_API_KEY },
    { name: 'Gemini', fn: () => geminiChat(systemPrompt, userPrompt), enabled: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) },
  ];

  const errors = [];
  for (const p of providers) {
    if (!p.enabled) continue;
    try {
      console.log(`🤖 [llmProvider] Essai provider: ${p.name}`);
      const result = await p.fn();
      if (result) {
        console.log(`✅ [llmProvider] ${p.name} OK`);
        return { answer: result, provider: p.name };
      }
    } catch (e) {
      console.warn(`⚠️ [llmProvider] ${p.name} failed: ${e.message}`);
      errors.push(`${p.name}: ${e.message}`);
    }
  }

  throw new Error(`Tous les providers IA ont échoué. ${errors.join(' | ')}`);
}
