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

## Docker

Requires Docker and Docker Compose. Env is read at **runtime** (not baked into the image).

```bash
cp .env.example .env.local   # fill CHAT_* values
docker compose up --build
```

App: [http://localhost:3000](http://localhost:3000).

```bash
docker compose down
# or one-shot without Compose:
docker build -t mbulu:local .
docker run --rm -p 3000:3000 --env-file .env.local mbulu:local
```

Set `CHAT_ALLOWED_ORIGINS` to the origin browsers use (for local Compose, `http://localhost:3000`).

## Environment

Copy `.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `CHAT_API_KEY` | Bearer token for the chat provider |
| `CHAT_BASE_URL` | OpenAI-compatible API base URL (usually ends with `/v1`). Prefer host-local Ollama (`http://127.0.0.1:11434/v1` or `http://host.docker.internal:11434/v1` from containers). |
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
npm run dev         # local development
npm run build       # production build
npm run start       # serve the production build
npm run lint        # lint
npm run typecheck   # TypeScript check
npm test            # unit tests
npm run test:watch
```

## CI / CD

GitHub Actions (`CI`) runs on every push and pull request to `main`:

- `npm ci`, lint, typecheck, tests, production build
- Docker image build (no push)

Production deploys are **not** done by GitHub Actions. Use **Kamal** (see below) to build, push to GHCR, and deploy behind Caddy on the VPS.

## Kamal (VPS deploy behind Caddy)

Production target: **https://mbulu.mboya.dev** on server `10.7.0.1`.

Caddy already terminates TLS for `mboya.dev`. Kamal runs `kamal-proxy` on **localhost:3010** only (port 3001 is used by bashenga).

1. On the VPS, add `config/Caddyfile.mbulu` to your Caddy config and reload Caddy.
2. Point DNS for `mbulu.mboya.dev` at the server (if not already).
3. Create a GitHub PAT with `write:packages` + `read:packages` (classic token), or fine-grained **Packages** read/write on `mboyacodes-sketch/mbulu`.
4. If the org uses SSO, authorize the token for **mboyacodes-sketch** at [github.com/settings/tokens](https://github.com/settings/tokens).
5. Load secrets and deploy:

```bash
# Add to .env.local (one line, token only — no braces, no ${...} syntax):
#   KAMAL_REGISTRY_PASSWORD=ghp_your_token

kamal secrets print   # should show token length ~40, NOT ":-}" at the end
kamal setup           # first time only
kamal deploy
```

If `kamal secrets print` shows `:-}` at the end, `.kamal/secrets` was using broken `${VAR:-...}` syntax (now fixed) or `.env.local` has a malformed line.

Useful aliases: `kamal logs`, `kamal shell`. Health checks hit `GET /up`.

Requires Kamal **2.12+** (`gem install kamal` or `bundle install` from the root `Gemfile`).

If the SSH host/user differs, update `servers.web` (and optional `ssh.user`) in `config/deploy.yml`.

### macOS / OrbStack deploy host notes

Kamal expects **GNU** `cp` (`cp -rnT` for asset bridging). macOS BSD `cp` fails with `illegal option -- T`.

On the deploy Mac:

```bash
brew install coreutils
sudo ln -sfn "$(brew --prefix coreutils)/bin/gcp" /usr/local/bin/cp
```

Kamal prepends `/usr/local/bin` to `PATH`, so that symlink is picked up.

Also avoid broken Docker Hub `credsStore` entries in `~/.docker/config.json` on that host (they break pulls of public images like `basecamp/kamal-proxy`).

## UI theming

App styling lives in `src/styles/mbulu.css`. Change the theme tokens at the top of that file to restyle colors, radii, and layout width.

## Notes

- Conversation history is stored in the browser (`localStorage`), not on the server.
- Voice input uses the Web Speech API and works best in Chromium-based browsers.
- Keep secrets out of git; only `.env.example` should document variable names.
