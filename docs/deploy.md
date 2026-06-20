# Deploy — tested-image Docker on chatty

pr.openape.ai runs as a Docker container on chatty, following the same
pipeline as the four monorepo web apps (idp/troop/chat/org):

```
pnpm build (.output, native)
  → docker buildx --platform linux/amd64 -f compose/package.Dockerfile (COPY-only)
  → local smoke run (/api/health with dummy env)
  → docker push registry.openape.ai/openape-pr:prod-<sha>
  → chatty: scp compose/chatty.yml → /home/openape/prod-pr/docker-compose.yml
            pin PR_TAG in /home/openape/prod-pr/.env (PREV kept for rollback)
            docker compose pull + up
  → external health gate https://pr.openape.ai/api/health
  → on failure: revert pin + up again
```

## Commands

```bash
pnpm run deploy:image        # local deploy (needs docker login + ssh openape@chatty)
```

The GitHub Actions `Deploy` workflow runs the same script on every main push.

Required GH secrets/vars: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`,
`REGISTRY_PASSWORD` (push password for user `openape`, source:
`/home/openape/registry/push-credentials.txt` on chatty) and var
`DEPLOY_HOST=chatty.delta-mind.at`.

## Runtime layout on chatty

- `/home/openape/prod-pr/docker-compose.yml` + `.env` (`PR_TAG`,
  `PR_TAG_PREV`) — the compose project (`openape-pr`).
- The container mounts `/home/openape/projects/openape-pr/shared` at the
  identical path and reads the systemd-era `shared/.env` via `env_file` —
  SQLite (`NUXT_TURSO_URL=file:…/shared/data/openape-pr.db`) and secrets are
  untouched by deploys.
- Port publishes on `127.0.0.1:3009`, exactly where nginx already proxies
  (vhost `/etc/nginx/sites-available/pr.openape.ai`, 8443/8081 behind
  the Traefik SNI-passthrough edge).
- `user: 999:988` (openape) keeps DB/WAL files openape-owned.

## Rollback

```bash
# automatic: deploy-image.mjs reverts to PR_TAG_PREV when the health gate fails
# manual:
ssh openape@chatty.delta-mind.at
cd ~/prod-pr && sed -i 's/^PR_TAG=.*/PR_TAG=<known-good>/' .env
docker compose --env-file .env -f docker-compose.yml up -d pr
```

## Emergency fallback (systemd)

The pre-container unit stays installed but disabled. If the registry or
Docker is broken, the last rsync release on disk still works:

```bash
ssh openape@chatty.delta-mind.at 'cd ~/prod-pr && docker compose down'
ssh ubuntu@chatty.delta-mind.at 'sudo systemctl start openape-pr'
```

## One-time server setup

`scripts/server-setup.sh` (run once as root) created the dirs, `shared/.env`,
the systemd unit and the nginx vhost. New hosts additionally need the DNS
A record, the DNS-01 certbot cert and the Traefik passthrough entry — see the
plan `01KTY362XA63EMA1RW29CTK982` on plans.openape.ai for the exact commands.
