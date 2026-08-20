# Agent

A personal agentic AI, powered by Gemini and deployable straight to Vercel.

It's a Next.js app using the Vercel AI SDK's `streamText` with `maxSteps` — Gemini
can call tools (web search, calculator, date/time), see the results, and keep
reasoning across multiple steps before giving you a final answer. That loop is
what makes it "agentic" rather than a single-shot chatbot. A live **trace panel**
on the right shows every tool call as it happens.

## 1. Get a Gemini API key

https://aistudio.google.com/apikey — free tier is enough to get started.

## 2. Run locally

```bash
npm install
cp .env.example .env.local
# paste your key into .env.local
npm run dev
```

Open http://localhost:3000.

## 3. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or push this folder to a GitHub repo and import it at https://vercel.com/new.

Either way, set the environment variable in the Vercel project settings
(Settings → Environment Variables):

```
GOOGLE_GENERATIVE_AI_API_KEY = your key
```

(Optional) add `TAVILY_API_KEY` too if you want the `webSearch` tool to hit a
real search API instead of returning a stub.

## Extending it

- **Add a tool**: open `lib/tools.ts` and add a new entry to the `tools`
  object using the `tool({...})` helper — give it a `description`, a `zod`
  parameter schema, and an `execute` function. Gemini will pick it up
  automatically next request.
- **Change the model**: edit `app/api/chat/route.ts` — swap
  `google("gemini-2.5-flash")` for `google("gemini-2.5-pro")` for more
  capability at higher latency/cost.
- **Add memory**: for recall across sessions, wire up a small vector store
  (e.g. Vercel KV, Upstash Vector, or Supabase pgvector) and pull relevant
  context into the `system` prompt before each call.
- **Persist chats**: currently state lives only in the browser tab. Add a
  database (Postgres via Vercel Postgres, or SQLite via Turso) and save/load
  `messages` keyed by a conversation id.

## Stack

- Next.js 14 (App Router) + Tailwind
- Vercel AI SDK (`ai`, `@ai-sdk/google`)
- Edge runtime, streaming responses
