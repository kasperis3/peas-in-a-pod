# Peas in a Pod

Mobile-first accountability app — join pods, commit to habits, check in fast, and see who’s growing together.

## Quick start (Day 1 — no Supabase required)

```bash
cd peas-in-a-pod
npm install
npm start
```

The app runs in **local demo mode** when Supabase env vars are missing.

**Demo login:** `demo@peas.app` / `demo1234`

## Supabase setup

### 1. Run the database migration

In the [Supabase Dashboard](https://supabase.com/dashboard) → your project:

1. Open **SQL Editor** → **New query**
2. Copy the full contents of [`supabase/migrations/00001_skateboard.sql`](supabase/migrations/00001_skateboard.sql)
3. Paste and click **Run**

You should see tables: `profiles`, `pods`, `memberships`, `check_ins`, `invite_codes`.

**Optional:** In **Table Editor**, confirm those tables exist.

### 2. Get API keys

1. **Project Settings** (gear icon) → **API**
2. Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key (under Project API keys) → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Use the **anon** key only — never put the `service_role` key in the app.

### 3. Create `.env` in the project root

```bash
cd peas-in-a-pod
cp .env.example .env
```

Edit `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
EXPO_PUBLIC_DATA_SOURCE=supabase
```

### 4. Configure Auth (email sign-up)

1. **Authentication** → **Providers** → **Email** → ensure **Enabled**
2. **Authentication** → **Sign In / Providers** (or **Settings** → **Auth**):
   - For dev: turn **OFF** “Confirm email” so sign-up works immediately without clicking a link
3. Save

### 5. Restart Expo

Env vars load at startup — restart after changing `.env`:

```bash
npm start
```

Press `r` in the terminal or stop and run `npm start` again.

### 6. Verify

1. Open the app — the welcome screen should **not** show “Demo mode”
2. **Get Started** → create an account with a real email + password
3. Create a pod → check in

In Supabase **Table Editor** → `profiles` and `pods` should have new rows.

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Still shows demo mode | Check `.env` exists, keys are correct, `EXPO_PUBLIC_DATA_SOURCE=supabase`, restart Expo |
| Sign-up fails / “Email not confirmed” | Disable email confirmation in Auth settings |
| RLS / permission errors | Re-run the full migration SQL (policies are at the bottom of the file) |
| “Invalid API key” | Use **anon public**, not service_role; no extra spaces in `.env` |

## Deploy to Netlify (web)

1. Connect the repo; set **Base directory** to `peas-in-a-pod` if the repo root is the parent folder.
2. Build settings are in [`netlify.toml`](netlify.toml) (`expo export -p web` → `dist/`).
3. In **Site configuration → Environment variables**, add (for production builds):

   | Variable | Value |
   |----------|--------|
   | `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `EXPO_PUBLIC_DATA_SOURCE` | `supabase` |

   Mark them as **build** scope (not “secret” scanning targets — they are public client keys).

4. If the build still fails on “secrets scanning”, confirm [`netlify.toml`](netlify.toml) is committed (`SECRETS_SCAN_OMIT_KEYS`).

5. In Supabase **Authentication → URL configuration**, add your Netlify URL to **Redirect URLs** (e.g. `https://your-site.netlify.app/**`).

**Blank page on Netlify?** Redeploy after the latest commit — the root layout used to render nothing until auth finished. You should see the welcome screen immediately at [https://peas-in-a-pod.netlify.app](https://peas-in-a-pod.netlify.app) or `/welcome`.

### CLI alternative (optional)

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```


## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run ios` | iOS simulator |
| `npm run android` | Android emulator |

## Architecture

- **UI:** Expo Router + NativeWind (`app/`, `src/ui/`)
- **Domain:** Periods, member status, streaks (`src/domain/`)
- **Data:** Repository interfaces with Supabase + local implementations (`src/data/`)
- **State:** Zustand (`src/stores/`)

## Phase 1 features

- Email auth (local or Supabase)
- Create / join pods (invite code `PEA-####`)
- Leader approve / reject
- Quick check-in (completion + measurement)
- Accountability view with pea avatars
- Client-side streaks + grace
- **Export pod** (pod screen): TSV file/copy (`name`, `status`, `streak`, `last_check_in`, `this_period`) or plain text for Apple Notes

## Phase 2 (planned)

- `00002_harden.sql` — DB triggers, tighter RLS
- Google / Apple Sign-In
- Push notifications
