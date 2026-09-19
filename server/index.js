import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3001;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173' })); // In production Vercel handles same-origin via rewrites
app.use(express.json({ limit: '1mb' }));

// Rate limiter for /api/parse
const parseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// ── Groq extraction prompt ──────────────────────────────────────────────────

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

const RETRY_PROMPT = 'Your previous response was not valid JSON. You MUST return ONLY a valid JSON array with no surrounding text, markdown, or explanation. Return the corrected JSON array now.';

// ── Helper: call Groq ────────────────────────────────────────────────────

async function callGroq(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages,
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const error = new Error('Groq API error ' + res.status);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Helper: try to parse JSON from model output ─────────────────────────────

function tryParseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const parsed = JSON.parse(cleaned);

  // Groq with response_format may wrap array in an object like { "results": [...] }
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'object' && parsed !== null) {
    const firstArray = Object.values(parsed).find(v => Array.isArray(v));
    if (firstArray) return firstArray;
  }
  return parsed;
}

// ── POST /api/parse ─────────────────────────────────────────────────────────

app.post('/api/parse', parseLimiter, async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return res.status(400).json({ error: 'rawText is required and must be a non-empty string.' });
  }

  // Enforce a strict character length limit (100,000 characters is generous for an email)
  if (rawText.length > 100000) {
    return res.status(400).json({ error: 'Email text is too large. Please limit to 100,000 characters.' });
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(500).json({ error: 'Groq API key is not configured. Add GROQ_API_KEY to server/.env' });
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: rawText },
  ];

  try {
    let raw = await callGroq(messages);
    let parsed;

    try {
      parsed = tryParseJSON(raw);
    } catch {
      console.warn('First Groq response was not valid JSON. Retrying…');
      messages.push({ role: 'assistant', content: raw });
      messages.push({ role: 'user', content: RETRY_PROMPT });
      raw = await callGroq(messages);
      parsed = tryParseJSON(raw);
    }

    if (!Array.isArray(parsed)) {
      return res.status(502).json({ error: 'Groq returned valid JSON but it was not an array.' });
    }

    return res.json({ results: parsed });
  } catch (err) {
    console.error('Parse error:', err);

    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid Groq API key.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Groq rate limit exceeded. Please wait a moment and try again.' });
    }
    if (err.status) {
      return res.status(502).json({ error: 'Groq API returned status ' + err.status + ': ' + err.body });
    }

    return res.status(500).json({ error: 'Failed to parse the email. The AI response was not valid JSON even after retry.' });
  }
});

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Start ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('✔ Placement Filter server running on http://localhost:' + PORT);
  });
}

export default app;
