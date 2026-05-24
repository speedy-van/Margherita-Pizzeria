# Margherita Admin — Mobile debug harness

> **TEMPORARY.** This Expo/React Native project is a debug companion for the
> native Kotlin admin app at `apps/admin-android`. It is **not** the production
> mobile app. The production target remains native Kotlin. Use this harness to
> reproduce backend contract bugs quickly on Metro's port 8081, then port
> verified fixes into the Kotlin app.

## What it does

- Mirrors the same screens (Login, Forgot password, Dashboard, Orders,
  Bookings, Menu, Discounts, Images, Settings) as the Kotlin app.
- Talks to the same backend endpoints (`/api/mobile/admin/login`,
  `/api/admin/*`) using the same 30-day JWT bearer flow.
- Renders the **raw JSON envelope** on every screen so contract drift is
  immediately visible — no debugger needed.
- Optional `x-dev-admin: true` header toggle (honoured by
  `lib/auth/require-admin.ts` in non-production only) for quick reads
  without signing in.

## Install & run

```powershell
cd apps/admin-mobile
npm install
npm start                  # Metro on http://localhost:8081 (default)
# or
npm run web                # browser preview
npm run android            # opens Expo Go / dev client on a device
```

`npm start` opens the Metro dev server on **http://localhost:8081**.

## Pointing at the backend

The base URL field on the Login screen (and in **More → Backend base URL**)
defaults to:

| Target              | Default                       |
|---------------------|-------------------------------|
| Web browser preview | `http://localhost:3000`       |
| Android emulator    | `http://10.0.2.2:3000`        |
| iOS simulator       | `http://localhost:3000`       |
| Real phone over LAN | set manually, e.g. `http://192.168.1.161:3000` |

The chosen URL is persisted in AsyncStorage under `margherita.baseUrl`.

## Why this exists alongside the Kotlin app

The Kotlin app is the real one. This harness exists so that:

1. We can hit each backend endpoint from a phone-shaped UI in seconds,
   without a Gradle/SDK/emulator round-trip.
2. We see the actual server response inline, surfacing contract mismatches
   that the Kotlin app silently swallows due to its lenient kotlinx
   serialization config.
3. We can A/B the same auth/JWT flow that the Kotlin app uses.

When the bugs are fixed, port the verified payloads/headers back into the
Kotlin code and stop using this harness.
