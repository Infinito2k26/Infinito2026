# Deployment Runbook — API on a GCP VM, Web on Vercel

Phase 1 item 5. Single-VM deployment for the API (+ Postgres + Redis via
`docker-compose.prod.yml`); the web app deploys separately to Vercel
(zero-config for a Next.js app, free tier).

Domain: institute subdomain (`infinito.iitp.ac.in`) is the target, but IT
provisioning it is out of this runbook's control and may not land
immediately. Everything below works over the VM's bare external IP first —
swapping in the real domain later is just a DNS record + one env var change
(`WEB_ORIGIN` / `NEXT_PUBLIC_API_URL`), no code change.

## 1. Create the VM

Once `gcloud` is authenticated (`gcloud auth login`, then `gcloud config set project <PROJECT_ID>`):

```bash
gcloud compute instances create infinito-api \
  --zone=asia-south1-a \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

gcloud compute firewall-rules create allow-infinito-http \
  --allow=tcp:80,tcp:443,tcp:3000 \
  --target-tags=http-server,https-server \
  --direction=INGRESS
```

`e2-small` (2GB RAM) is enough for the API + Postgres + Redis at this
project's expected scale (the budget doc's own estimate: 50-100 concurrent
users). `asia-south1` (Mumbai) is the nearest GCP region to Patna.

## 2. Install Docker on the VM

```bash
gcloud compute ssh infinito-api --zone=asia-south1-a
# --- on the VM ---
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to apply
```

## 3. Get the code and image onto the VM

The VM only needs `docker-compose.prod.yml` and a `.env.prod` — it pulls the
API image from GHCR rather than building locally.

```bash
# on the VM
mkdir infinito && cd infinito
curl -O https://raw.githubusercontent.com/Infinito2k26/Infinito2026/main/docker-compose.prod.yml
```

Log in to GHCR to pull the image (the CI pipeline pushes here — see
`.github/workflows/ci.yml`):

```bash
echo "$GITHUB_PAT" | docker login ghcr.io -u <your-github-username> --password-stdin
```

(`GITHUB_PAT` needs at least `read:packages` scope. A personal access token
is fine for now.)

## 4. Write `.env.prod`

```bash
cat > .env.prod <<'EOF'
NODE_ENV=production
PORT=3000
POSTGRES_PASSWORD=<generate a real one>
DATABASE_URL=postgresql://postgres:<same password>@postgres:5432/infinito_prod
REDIS_URL=redis://redis:6379
CLOUDINARY_CLOUD_NAME=<real value>
CLOUDINARY_API_KEY=<real value>
CLOUDINARY_API_SECRET=<real value>
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
QR_SIGNING_SECRET=<openssl rand -base64 48>
WEB_ORIGIN=https://<your-vercel-app>.vercel.app
RESEND_API_KEY=<optional — leave blank to just log reset links>
EMAIL_FROM=Infinito 2K26 <no-reply@infinito2k26.dev>
SENTRY_DSN=<optional>
EOF
export API_IMAGE=ghcr.io/infinito2k26/infinito2026/api:latest
```

Never commit this file — it's real secrets. `WEB_ORIGIN` must be the actual
Vercel URL (or the real domain, once it exists) for CORS to work.

## 5. Bring the stack up and migrate

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
# run migrations against the now-running postgres container
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T api \
  npx prisma migrate deploy --schema=prisma/schema.prisma
```

Confirm it's alive: `curl http://<VM_EXTERNAL_IP>:3000/api/health` should
return `{"success":true,"data":{"status":"ok","checks":{"db":"ok","redis":"ok"}}}`.

## 6. Deploy the web app to Vercel

```bash
cd apps/web
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL=http://<VM_EXTERNAL_IP>:3000/api` (or the real
domain once it exists, over HTTPS) as a Vercel environment variable.

## 7. TLS

The VM currently serves the API over plain HTTP on port 3000 — fine behind
Vercel's own HTTPS for the web app calling it, but not ideal long-term. Once
a domain (institute subdomain or otherwise) points at the VM, the smallest
addition is [Caddy](https://caddyserver.com/) as a reverse proxy in front of
the API container — automatic HTTPS via Let's Encrypt, one line of config.
Not wired up here since it needs a real domain to request a certificate for.

## 8. Redeploying after a code change

```bash
# on the VM, once CI has pushed a new image
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
# migrate again only if this release includes a new migration
```

This is the manual step the CD pipeline (`.github/workflows/ci.yml`) doesn't
automate yet — see that file's comment for what an SSH-based auto-deploy
step would need.

## Backups

See `docs/backup-restore.md` — schedule `scripts/db-backup.sh` as a cron job
on this VM once it's live, pointed at `DATABASE_URL` from `.env.prod`.
