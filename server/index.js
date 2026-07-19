import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// ── Mistral extraction prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a structured data extractor for college placement cell emails.

TASK:
Read the raw email text provided by the user. Extract EVERY distinct job or internship posting mentioned.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No prose, no markdown fences, no explanation — just the JSON array.

Each object in the array must have these exact fields:
- "company" (string)
- "role" (string)
- "work_mode" — one of: "remote", "hybrid", "onsite", "unspecified"
- "eligible_batches" — array of integer years, e.g. [2026, 2027]. Use [] if not mentioned.
- "employment_type" — one of: "fresher", "internship", "experienced", "unspecified"
- "ctc_or_stipend" (string) — raw as mentioned, or "not mentioned"
- "location" (string) — or "not mentioned"
- "deadline" (string) — or "not mentioned"
- "apply_link" (string) — a web URL to apply, or "not mentioned"
- "apply_email" (string) — an email address to send CV/resume to (e.g. hr@company.com), or "not mentioned". Look for phrases like "send your CV to", "mail your resume at", "apply via email", "drop your resume at", etc.
- "raw_snippet" (string) — the original text chunk this posting was extracted from, for verification

RULES:
- If a field is ambiguous or missing, use "unspecified" for enum fields and "not mentioned" for string fields.
- Normalize work_mode and employment_type to the allowed values listed above (case-insensitive match).
- If the email lists multiple roles under one company, create a SEPARATE object for each role.
- IMPORTANT: Do NOT create duplicate entries. If the same company + role combination appears multiple times in the email (e.g. repeated in headers, footers, or forwarded copies), output it only ONCE.
- If an email address is mentioned alongside a job posting (for sending CVs/resumes), extract it into "apply_email". Do NOT put email addresses in "apply_link" — that field is only for web URLs.
- Never fail. Always return at least an empty array [].
- Do NOT wrap the JSON in markdown code fences or add any text outside the array.`;

const RETRY_PROMPT = `Your previous response was not valid JSON. You MUST return ONLY a valid JSON array with no surrounding text, markdown, or explanation. Return the corrected JSON array now.`;

// ── Helper: call Mistral ────────────────────────────────────────────────────

async function callMistral(messages) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages,
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const error = new Error(`Mistral API error ${res.status}`);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Helper: try to parse JSON from model output ─────────────────────────────

function tryParseJSON(text) {
  // Strip markdown fences if the model added them despite instructions
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

// ── POST /api/parse ─────────────────────────────────────────────────────────

app.post('/api/parse', async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return res.status(400).json({ error: 'rawText is required and must be a non-empty string.' });
  }

  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === 'your_mistral_api_key_here') {
    return res.status(500).json({ error: 'Mistral API key is not configured. Add it to server/.env' });
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: rawText },
  ];

  try {
    // First attempt
    let raw = await callMistral(messages);
    let parsed;

    try {
      parsed = tryParseJSON(raw);
    } catch {
      // Retry once with stricter instruction
      console.warn('First Mistral response was not valid JSON. Retrying…');
      messages.push({ role: 'assistant', content: raw });
      messages.push({ role: 'user', content: RETRY_PROMPT });
      raw = await callMistral(messages);
      parsed = tryParseJSON(raw); // If this throws, we catch below
    }

    if (!Array.isArray(parsed)) {
      return res.status(502).json({ error: 'Mistral returned valid JSON but it was not an array.' });
    }

    return res.json({ results: parsed });
  } catch (err) {
    console.error('Parse error:', err);

    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid Mistral API key.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Mistral rate limit exceeded. Please wait and try again.' });
    }
    if (err.status) {
      return res.status(502).json({ error: `Mistral API returned status ${err.status}: ${err.body}` });
    }

    return res.status(500).json({ error: 'Failed to parse the email. The AI response was not valid JSON even after retry.' });
  }
});

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✔ Placement Filter server running on http://localhost:${PORT}`);
});
