import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// ── Gemini Configuration ──────────────────────────────────────────────────

// We can define a schema for the exact JSON output we want. Gemini respects this perfectly.
const responseSchema = {
  type: SchemaType.ARRAY,
  description: "List of job or internship postings extracted from the email.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      company: { type: SchemaType.STRING },
      role: { type: SchemaType.STRING },
      work_mode: { type: SchemaType.STRING, description: "remote, hybrid, onsite, or unspecified" },
      eligible_batches: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.INTEGER }, 
        description: "List of graduation years like [2026, 2027]" 
      },
      employment_type: { type: SchemaType.STRING, description: "fresher, internship, experienced, or unspecified" },
      ctc_or_stipend: { type: SchemaType.STRING },
      location: { type: SchemaType.STRING },
      deadline: { type: SchemaType.STRING },
      apply_link: { type: SchemaType.STRING },
      apply_email: { type: SchemaType.STRING, description: "Email address to send CV/resume to" },
      raw_snippet: { type: SchemaType.STRING, description: "The original text chunk this posting was extracted from" },
    },
    required: ["company", "role", "work_mode", "eligible_batches", "employment_type", "ctc_or_stipend", "location", "deadline", "apply_link", "apply_email", "raw_snippet"],
  }
};

const SYSTEM_PROMPT = `You are a structured data extractor for college placement cell emails.

TASK:
Read the raw email text provided by the user. Extract EVERY distinct job or internship posting mentioned.

RULES:
- If a field is ambiguous or missing, use "unspecified" for enum fields and "not mentioned" for string fields.
- If the email lists multiple roles under one company, create a SEPARATE object for each role.
- IMPORTANT: Do NOT create duplicate entries.
- If an email address is mentioned alongside a job posting (for sending CVs/resumes), extract it into "apply_email". Do NOT put email addresses in "apply_link".
- Never fail. Always return at least an empty array [].`;


// ── POST /api/parse ─────────────────────────────────────────────────────────

app.post('/api/parse', async (req, res) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return res.status(400).json({ error: 'rawText is required and must be a non-empty string.' });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(500).json({ error: 'Gemini API key is not configured. Add it to server/.env and Vercel.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = await model.generateContent(rawText);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return res.json({ results: parsed });
  } catch (err) {
    console.error('Parse error:', err);
    return res.status(500).json({ error: 'Failed to parse the email with Gemini. ' + err.message });
  }
});

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Start ───────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✔ Placement Filter server running on http://localhost:${PORT}`);
  });
}

export default app;
