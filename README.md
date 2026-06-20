# OpenApe PR

**Upload a pull request — diff, description, images — review it on a beautiful
diff, and pull the verdict back.**

https://pr.openape.ai

An agent opens a PR, runs one command, and gets a review link. A human reviews
the diff (split or unified, syntax-highlighted), leaves a verdict and inline
comments, and the agent polls the result and acts on it.

```bash
ape-pr upload ./out
# → https://pr.openape.ai/prs/01JX…

ape-pr status <slug> --wait
# → verdict: request-changes
#     app/components/ReplyBox.vue:41 (new) — cap autoRows at min 2.
```

The review surface is dark and mobile-first: file sidebar, +/− counts, a
Split⇄Unified toggle, the markdown description (links and images), and
click-a-line inline comments with optional image attachments. Only a human
reviewer (`act=human`) can submit a verdict; agents upload and poll.

## Layout

| Path | What |
|---|---|
| `app/` | Nuxt 4 web app + Nitro API (`@openape-pr/app`) — DDISA login via `@openape/nuxt-auth-sp`, SQLite (libsql) + Drizzle, diff rendered with `diff2html` |
| `cli/` | `@openape/ape-pr` — citty CLI, unified `apes login` auth via `@openape/cli-auth` |
| `scripts/` | `deploy-image.mjs` — tested-image Docker deploy to chatty |
| `fixtures/sample-pr/` | Example PR directory (`pr.json` + `diff.patch`) for E2E |

## Quick start (local)

```bash
pnpm install
pnpm dev                  # app on http://localhost:3006

# in another shell — upload the sample fixture against your dev server
pnpm cli:build
APE_PR_ENDPOINT=http://localhost:3006 node cli/dist/cli.mjs upload fixtures/sample-pr
```

Auth: `apes login <email>` once per device (covers all OpenApe CLIs).
The web login lives directly on the start page.

## API surface

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/prs` | bearer/session | Create PR from manifest, returns `{ id, slug, review_url, files, additions, deletions }` |
| `PUT /api/prs/:id/assets/<path>` | uploader or human | Upload one image (raw bytes, ≤8MB) |
| `GET /api/prs` | session | List PRs (`?status=pending\|reviewed`) |
| `GET /api/prs/:id` | session | PR detail: raw diff + rendered description + latest review |
| `DELETE /api/prs/:id` | uploader | Delete (review link 404s) |
| `POST /api/prs/:id/review` | human only | Submit verdict + inline comments |
| `GET /api/prs/:slug/review` | bearer/session | Poll the verdict (`{ state, verdict, comments[] }`) |
| `POST /api/cli/exchange` | — | RFC 8693 token exchange for the CLI |

Manifest contract: `ape-pr docs manifest` (source: `cli/src/docs/manifest.md`).

## Deploy

Tested-image Docker deploy on chatty, same mechanics as the monorepo web apps:
`pnpm run deploy:image` builds `.output` natively, packages a COPY-only amd64
image (`compose/package.Dockerfile` — installs the arch-matched libsql native
binding Nitro drops), smoke-tests it, ships it to chatty, pushes to
registry.openape.ai and runs `docker compose pull && up` with an `/api/health`
gate and tag rollback (`PR_TAG_PREV`). Publishes on 127.0.0.1:3009; the edge
(Traefik) terminates TLS for pr.openape.ai.
