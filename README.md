# Mbulu

Minimal Next.js chat app with streaming replies, markdown rendering, optional voice input, and a calm conversation-first UI.

## Features

- Streaming chat against an OpenAI-compatible API
- Markdown responses with language-aware code highlighting
- Browser speech-to-text (where supported)
- Local conversation memory in the browser
- Optional access code gate, origin allowlist, and rate limits
- Stop control for in-progress generations

## Requirements

- Node.js 20+
- An OpenAI-compatible chat endpoint

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure values in `.env.local` only. Never commit that file.

## Environment

Copy `.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `CHAT_API_KEY` | Bearer token for the chat provider |
| `CHAT_BASE_URL` | OpenAI-compatible API base URL (usually ends with `/v1`) |
| `CHAT_MODEL` | Model id to use |
| `CHAT_SYSTEM_PROMPT` | System prompt for the assistant |
| `CHAT_ACCESS_SECRET` | Optional access code required to use the app |
| `CHAT_ALLOWED_ORIGINS` | Comma-separated allowed browser origins |
| `CHAT_RATE_LIMIT_PER_MIN` | Max chat requests per IP per minute |
| `CHAT_RATE_LIMIT_PER_HOUR` | Max chat requests per IP per hour |
| `CHAT_MAX_MESSAGES` | Max messages accepted in one request payload |
| `CHAT_MAX_MESSAGE_CHARS` | Max characters per message |
| `CHAT_CONTEXT_MESSAGES` | How many recent messages are sent to the model |

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint
npm test         # unit tests
npm run test:watch
```

## UI theming

App styling lives in `src/styles/mbulu.css`. Change the theme tokens at the top of that file to restyle colors, radii, and layout width.

## Notes

- Conversation history is stored in the browser (`localStorage`), not on the server.
- Voice input uses the Web Speech API and works best in Chromium-based browsers.
- Keep secrets out of git; only `.env.example` should document variable names.
