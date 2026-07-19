# Placement Filter

Parse messy placement cell emails into clean, filterable job postings using Mistral AI.

## Quick Start

### 1. Add your Mistral API key

Create (or edit) `server/.env`:

```
MISTRAL_API_KEY=your_mistral_api_key_here
```

Get a key at [https://console.mistral.ai/](https://console.mistral.ai/)

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Run locally

```bash
npm run dev
```

This starts:
- **Client** → http://localhost:5173
- **Server** → http://localhost:3001

## How it works

1. Paste the raw text of a placement email into the textarea.
2. Click **Parse & Filter**.
3. The server sends the text to Mistral AI, which extracts structured job data.
4. Browse, filter, sort, and export the results — all client-side.

## Project Structure

```
├── client/       # React + Vite frontend
├── server/       # Express proxy for Mistral API
├── package.json  # Root scripts (concurrently)
└── README.md
```
