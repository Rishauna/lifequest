# LifeQuest

A cozy, responsive, gamified daily task tracker built with React, TypeScript, Vite, and optional Supabase cloud sync.

## Included in this first version

- Responsive dashboard for computer and phone
- Seven life categories
- Create, complete, and delete quests
- One-time, daily, and weekly recurrence labels
- XP, levels, and virtual coins
- Customizable rewards shop with coin redemption
- Profile name and avatar customization
- Progress dashboard and starter achievements
- Local browser save that works before cloud setup
- Optional Supabase account sign-in and cross-device save
- PWA manifest so it can be installed on supported devices

## Run locally

1. Install Node.js (LTS) from https://nodejs.org/
2. Unzip this project.
3. Open a terminal in the `lifequest` folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Enable free cloud sync with Supabase

The app is local-first until you configure Supabase.

1. Create a project at https://supabase.com/
2. In the Supabase dashboard, open **SQL Editor** and run `supabase/schema.sql`.
3. Open **Project Settings → API** and copy the Project URL and anon/public key.
4. Copy `.env.example` to `.env.local`.
5. Put your values in `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

6. Restart `npm run dev`.
7. In LifeQuest, open **Settings & sync**, create an account, and sign in on both devices.

Security notes:
- Use only the Supabase anon/public key in the browser; never put a service-role key in frontend code.
- The SQL enables Row Level Security and restricts saved rows to the signed-in owner.
- Configure email confirmation settings in Supabase as you prefer.
- Cloud syncing is best-effort; the app retains a local browser copy as well.

## Free deployment with Vercel

1. Create a GitHub repository and push this project to it.
2. Sign in at https://vercel.com/ and import the repository.
3. Vercel should detect Vite automatically. Build command: `npm run build`; output directory: `dist`.
4. In Vercel project settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if using cloud sync.
5. Deploy. Open the deployed URL on your phone and choose **Add to Home Screen** / **Install app** where supported.
6. If using Supabase email authentication, add your deployed URL to Supabase **Authentication → URL Configuration** and configure the site URL and redirect URLs.

Free-plan features, quotas, and policies can change. Check the providers' current terms before relying on a free tier.

## Build check

```bash
npm run build
```

## Notes / current MVP limitations

- Daily/weekly recurrence is represented in the task model; full automatic scheduling of next instances is a next-stage enhancement.
- Browser notification scheduling, an AI planner, calendar view, and historical weekly charts are planned next-stage features.
- This starter is not a native app-store binary. It is a PWA-style web app.
- The current first version is designed as a practical MVP and should be tested with your own devices before relying on it for important reminders.
