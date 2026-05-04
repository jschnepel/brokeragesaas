# yong2

Yong Choi's agent website (dark cinematic editorial redesign). Next.js 16, App Router.

## Dev

cd yong2
cp .env.example .env.local   # fill in RDS + Resend keys
npm install
npm run dev                  # http://localhost:3000

## Build

npm run build
npm start

## Tests

npm run test       # unit (vitest)
npm run test:e2e   # smoke (playwright)

## Docker (dev)

Spin up a dev container that mirrors local `npm run dev` with hot reload. Source is bind-mounted so edits in your editor reload inside the container.

    cd yong2
    cp .env.example .env.local        # optional — picked up by env_file if present
    docker compose up                 # builds on first run, then http://localhost:3200
    docker compose up -d              # detached
    docker compose down               # stop and remove the container

On first build, `npm install` runs inside the image and `node_modules` + `.next` are kept in anonymous volumes (your host directories aren't overwritten).

### Port registry

yong2's reserved Docker port is **3200**. Do not change without updating both `docker-compose.yml` and this section.

| Service | Host port | Container port |
|---|---|---|
| **yong2** (this app) | **3200** | 3000 |
| Jeane | 3100 | 3000 |
| premium-site / platform | 3000 / 3001 / 3003 | — |

## Structure

- `app/` — routes + layouts
- `components/` — UI by surface (chrome, hero, home, portfolio, communities, about, contact, shared)
- `lib/` — data access, email, utilities
- `content/` — typed content source (copy, curated slug lists)
- `styles/tokens.css` — palette CSS variables
- `public/` — static assets (hero posters, OG)

## Asset notes

- `public/hero/hero-poster.jpg` is currently a 1920×1080 solid dark-ink (#0E1620) placeholder JPEG generated with `sharp` so `next/image` resolves in dev. Replace with a licensed dark desert/estate still before any stakeholder review or deploy.

## Deployment

Deployed on Vercel (Fluid Compute default).

Required env vars (Vercel dashboard → Settings → Environment Variables):
- `RDS_DATABASE_URL`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

First-time link:

    vercel link            # select or create yong2 project
    vercel env pull        # pull envs to .env.local
    vercel --prod          # deploy

