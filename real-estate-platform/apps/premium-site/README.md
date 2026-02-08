# Premium Site

Custom frontend for premium tier agents.

## Overview

This is a fully customizable site for high-tier clients. Each premium site gets:
- Custom branding and design
- Dedicated AWS Amplify deployment
- Full access to all features
- Custom domain support

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

## Environment Variables

See `.env.local.example` for required environment variables.

## Structure

```
app/
├── (routes)/           # Page routes
│   ├── page.tsx        # Homepage
│   ├── properties/     # Property listings
│   ├── neighborhoods/  # Neighborhood pages
│   ├── about/          # About page
│   └── contact/        # Contact page
├── api/                # API routes (if needed)
└── layout.tsx          # Root layout

components/             # React components
├── PropertyCard.tsx
├── ContactForm.tsx
└── Navigation.tsx

lib/                    # Utilities
├── agent-context.tsx   # Agent context provider
└── api-client.ts       # API client
```

## Customization

Premium sites can be customized through:
1. Brand colors (CSS variables)
2. Typography (font families)
3. Component variants
4. Custom pages
5. Feature toggles
