import { routes, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  headers: [
    routes.cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/hero/(.*)', { public: true, maxAge: '1 day' }),
  ],
};

export default config;
