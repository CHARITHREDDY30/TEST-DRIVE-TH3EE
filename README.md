# TH3EE Storefront — Deployment Package

This package wraps the supplied storefront component in a Vite + React + TypeScript + Tailwind build setup. The existing `src/App.tsx` is preserved as the source of the storefront UI; no intentional UI/UX redesign was made.

## Requirements
- Node.js 20.19+ or 22.12+
- npm

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```
The production files are generated in `dist/`.

## Deploy
- **Vercel:** Import the repository; build command `npm run build`, output directory `dist`. `vercel.json` provides SPA fallback for product URLs.
- **Netlify:** Import the repository; `netlify.toml` configures the build and SPA fallback.
- **Cloudflare Pages:** Build command `npm run build`, output directory `dist`; configure a SPA fallback if needed.

## Important deployment limitations
- The supplied app currently persists catalog, hero, orders, cart, and settings in browser `localStorage`. This is browser-specific and is not a shared, production database. Admin edits and orders will not sync across devices/users. A real InsForge backend and secure server-side payment flow are separate work and are not configured by this frontend-only package.
- Do not put database connection strings, InsForge service-role keys, payment secret keys, or R2 secret access keys in frontend environment variables. Only public client keys belong in `VITE_*` variables.
- Product images use public R2 URLs embedded in the source. Confirm every URL is public and the intended image before launch.
- Demo order records, ratings/review counts, and stock values in the supplied source must be replaced with real data before taking live orders.
- Test the WhatsApp order flow, product links, refresh on `/products/...`, mobile navigation, and admin UI after deployment.
