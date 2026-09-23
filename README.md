# Nudge

Personal follow-up and task management — a command center for people managing multiple concurrent workstreams.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase (Auth, Firestore, FCM, Cloud Functions)
- Cloudflare Pages (hosting)

## Getting Started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Add your Firebase project credentials to `.env.local`.

3. Install and run:

```bash
npm install
npm run dev
```

## Firebase Setup

1. Create a Firebase project (separate dev and production recommended).
2. Enable Google Authentication.
3. Create a Firestore database.
4. Deploy security rules: `firebase deploy --only firestore:rules`
5. Enable Cloud Messaging and add a Web Push certificate (VAPID key).
6. Deploy Cloud Functions for reminder processing: `cd functions && npm install && npm run deploy`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |

## Deployment (Cloudflare Workers / Pages)

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Output directory: `dist`
- SPA routing is handled by `wrangler.jsonc` (`not_found_handling: "single-page-application"`). Do **not** add a `_redirects` file — it conflicts with Wrangler and causes deploy error `100324`.
- Add `VITE_FIREBASE_*` environment variables in your Cloudflare project settings.

## Architecture

- **Quick capture** — natural language parsing extracts type, person, labels, and reminders
- **Search** — client-side filtering via `SearchService` (swappable for Algolia/Typesense later)
- **Reminders** — Firestore `reminderAt` + Cloud Function scheduler + FCM push
- **Offline** — Firestore persistence + offline banner
