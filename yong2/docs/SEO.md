# yong2 SEO + Rendering Strategy

> Updated: 2026-04-27

## Rendering strategy per route

| Route | Strategy | Revalidate | SSG params | Why |
|---|---|---|---|---|
| / | ISR | 1800s | n/a | Featured tiles + curated communities |
| /about | Pure SSG | static | n/a | Doesn't change |
| /contact | Pure SSG | static | n/a | Static shell, interactive form |
| /portfolio | ISR | 1800s | n/a | Active listing grid |
| /portfolio/[slug] | ISR + SSG | 3600s | top 24 luxury | Pre-render top set, ISR rest |
| /listings | Streaming SSR | n/a | n/a | Real-time discovery; static shell + streamed results |
| /communities | ISR | 3600s | n/a | Curated 4 cards |
| /communities/[slug] | ISR + SSG | 3600s | all 4 slugs | Tiny set, fully pre-rendered |
| /market-reports | ISR | 3600s | n/a | Quarterly cadence |
| /market-reports/[slug] | ISR + SSG | 3600s | all 4 quarter slugs | Fully pre-rendered |
| /api/listings/search | Dynamic + edge cache | s-maxage=30, swr=60 | n/a | User input |
| /api/contact | Dynamic POST | no cache | n/a | Mutation |
| /api/health | Dynamic | no cache | n/a | Liveness |
| /sitemap.xml | ISR cycle | implicit | n/a | Auto |
| /robots.txt | Static | n/a | n/a | Static |
| /opengraph-image (per listing) | Dynamic + revalidate | 3600s | n/a | Cached after first hit |

## SEO building blocks

| Asset | Status |
|---|---|
| Per-page Metadata (title/description) | done |
| Per-listing dynamic OG images | done |
| JSON-LD: RealEstateListing, RealEstateAgent, Place, WebSite | done |
| sitemap.xml | done |
| robots.txt | done |
| Canonical URL per page | added in this commit |
| BreadcrumbList JSON-LD | added in this commit |
| Image alt text audit | audited in this commit |
| Heading hierarchy audit | audited in this commit |
| Internal linking pass | added in this commit |
| HTTPS + HSTS | done — Vercel default |
| Streaming SSR on /listings | added in this commit |
| Re-enable PPR | pending Next 16 framework patch |

## Webmaster verification (post-launch)

- Google Search Console — add site verification meta tag
- Bing Webmaster Tools — same
- Submit sitemap.xml to both
