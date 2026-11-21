# Laura — Your thinking partner

A responsive personal AI workspace built with Next.js, Gemini, and the Vercel AI SDK. Explore ideas, create, code, and understand—with visible agent tool activity.

## Features

- Responsive dark workspace with mobile navigation and four editable prompt starters.
- Streamed Markdown responses with code blocks, copy, retry, and stop controls.
- Balanced, Concise, and Detailed response styles.
- Browser-local conversation history (up to 50 chats), search (`Ctrl/Cmd + K`), individual deletion, and clear-history controls.
- Download conversations as Markdown.
- Inline tool results and an activity panel for web search, arithmetic, and UTC date/time.
- Settings panel showing server-side Gemini and Tavily configuration status; no API keys exposed to the browser.
- Bounded request bodies, basic conversation validation, generation token/step limits, cancellation, and search timeouts.
- Locally bundled fonts: production builds do not need Google Fonts access.

## Run locally

Requires Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env.local
# Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000. Get a Gemini key from https://aistudio.google.com/apikey.

The interface works without credentials, but **AI responses require a valid key**. In Settings, "Configured" indicates an environment variable is present, not that provider authentication has been verified. Restart the server after changing environment variables.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes, for AI responses | Server-side Gemini credential |
| `GOOGLE_GENERATIVE_AI_MODEL` | No | Defaults to `gemini-2.5-flash`; choose a model available to your account |
| `TAVILY_API_KEY` | No | Enables web search; otherwise the tool reports that search is unavailable |

Never commit `.env.local` or real API keys. Do not enter API keys into chat.

## Development checks

```bash
npm run typecheck
npm test
npm run build
npm start
```

Tests cover calculator semantics, invalid/non-finite expressions, message validation, and streamed request-body limits. Providers are not contacted by these tests.

## Deploy

Import the repository into Vercel and add your environment variables in project settings, then deploy. The chat route uses the Edge runtime and streaming responses, with a requested 60-second maximum duration (hosting-plan limits may differ).

**Before exposing this personal workspace publicly, add access control and durable rate limiting.** The endpoint uses the owner's provider quota and is not authenticated. Body, token, and step limits are not a substitute for authentication or per-user spend controls. The existing Next.js/AI SDK dependency stack also has npm audit advisories; review and migrate to patched, compatible versions before public production use.

## Privacy and storage

Conversations are saved in localStorage on this browser/device, not in a server database. Shared-browser users can access them; browser clearing or storage limits can remove them. Export important chats. Messages are sent to Google for generation, and tool-generated search queries are sent to Tavily when configured. Full conversation contents are not logged by the application.

The response-style preference applies to subsequent requests in the current tab. Chat history is not synced across devices. There is no login/account system; "Personal account" denotes this local workspace only.

## Extend

- **Tools:** edit `lib/tools.ts`; each SDK tool defines a Zod parameter schema and an async executor. Results appear automatically in activity and inline tool cards.
- **Arithmetic:** `lib/calculator.ts` is a bounded parser, not `eval`. Supports `+ - * / % ^ **` and parentheses. Uses JavaScript floating-point arithmetic, not financial decimal precision.
- **Request validation:** `lib/chat-validation.ts` bounds actual request bytes, message count, roles, and content sizes. Tool/part payloads retain SDK-compatible structures and are not authenticated evidence of prior tool execution. Do not add privileged tools without server-side authorization and stronger validation.
- **Agent behavior:** edit the prompt and limits in `app/api/chat/route.ts`.
- **UI:** `app/page.tsx` and `app/globals.css` implement the workspace, local history, composer, and dialogs.

## Current limits

No attachments, voice input, cross-device sync, authentication, or server persistence. Live Gemini/Tavily behavior depends on your credentials, account quotas, model availability, and network access. Histories exceeding request limits should be exported and continued in a new chat.
