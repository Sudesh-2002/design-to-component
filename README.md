# Design → Component Playground

Turn a screenshot or a text description into a live, editable React + Tailwind component.

**Live demo:** [your-app.vercel.app](https://your-app.vercel.app)

![Screenshot](docs/screenshot.png)

## Features

- Describe a UI, drop in a screenshot, or paste one with Ctrl+V
- Vision model streams the component code as it's generated
- Live preview in a sandboxed iframe with mobile / tablet / full-width views
- Monaco editor: edits hot-update the preview
- Export as a single file, a runnable Vite project (.zip), or open in StackBlitz
- GitHub sign-in and saved history (Supabase, row-level security)
- Per-user and per-IP rate limiting (Upstash Redis)

## Tech

Next.js (App Router) · TypeScript · Tailwind · Zustand · Monaco · Groq (vision) ·
Supabase (auth + Postgres) · Upstash Redis · Vitest

## How it works

1. The browser downsizes the screenshot and POSTs it with the prompt to `/api/generate`.
2. The route checks the rate limit, calls the vision model, and streams the text back.
3. The client extracts the first code block from the stream and validates it.
4. The code is sent via `postMessage` to a sandboxed iframe (no `allow-same-origin`),
   compiled with Babel, and rendered behind an error boundary with loop guards.

### Security notes

- Generated code runs in an opaque-origin iframe with a restrictive CSP, so it can't
  reach the app's DOM, cookies, or storage, and can't make network requests.
- Supabase row-level security enforces that users only access their own rows.
- API keys stay server-side; only the Supabase anon key is public, by design.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in GROQ_API_KEY at minimum
npm run dev
```

Supabase and Upstash are optional locally: without them the app runs with no sign-in,
and rate limiting falls back to memory.

## Scripts

`npm run dev` · `npm test` · `npm run build` · `npm run lint`

## Limitations

- Only `react` is importable in generated components.
- Saved history stores a thumbnail, not the original screenshot.
- Free-tier AI limits apply.