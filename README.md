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

## Supabase setup (~30 min)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in [supabase/migrations/00001_skateboard.sql](supabase/migrations/00001_skateboard.sql) (SQL Editor or `supabase db push`)
3. Copy `.env.example` → `.env` and add your URL + anon key
4. Auth → Providers: enable Email; **disable email confirmation** for dev (Auth → Settings)
5. Set `EXPO_PUBLIC_DATA_SOURCE=supabase` in `.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_DATA_SOURCE=supabase
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
# peas-in-a-pod
