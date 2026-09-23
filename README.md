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

## Deployment (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_FIREBASE_*` environment variables in Cloudflare Pages settings.

## Architecture

- **Quick capture** — natural language parsing extracts type, person, labels, and reminders
- **Search** — client-side filtering via `SearchService` (swappable for Algolia/Typesense later)
- **Reminders** — Firestore `reminderAt` + Cloud Function scheduler + FCM push
- **Offline** — Firestore persistence + offline banner
