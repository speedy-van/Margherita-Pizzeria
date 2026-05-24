# Margherita Admin (Android)

Native Android admin client for the Margherita Pizzeria platform. Talks to the existing
Next.js admin APIs over HTTPS using a short-lived JWT issued by the mobile login endpoint.

- Kotlin + Jetpack Compose Material 3
- Manual DI (`AppContainer`) — no Hilt/Koin
- Retrofit + OkHttp + Kotlinx Serialization
- DataStore Preferences for the persisted session token
- Navigation Compose with a bottom NavigationBar shell

> **Status:** scaffolding/feature complete for v1 (login, dashboard, orders, bookings,
> menu, settings, images). FCM push is **not** wired up yet — the package leaves space
> for it but does not include `google-services.json` or the Firebase plugin.

## Prerequisites

- Android Studio Ladybug or newer (AGP 8.7.x)
- JDK 17
- An Android emulator (API 26+) or a physical device
- The Next.js web app running locally (`npm run dev` from the repo root) **or** the
  production URL reachable from the device

## First-time setup (Gradle wrapper)

This project ships **without** the binary `gradle/wrapper/gradle-wrapper.jar` to keep the
repo clean of build artefacts. Generate it once with either of the following:

- Open `apps/admin-android` in Android Studio — it will offer to download Gradle 8.10.2
  and create the wrapper automatically.
- Or, from a shell that already has Gradle 8.x installed:

  ```bash
  cd apps/admin-android
  gradle wrapper --gradle-version 8.10.2
  ```

Once the wrapper exists you can use `./gradlew` (Linux/macOS) or `.\gradlew.bat`
(Windows) for all subsequent commands.

## Configuring the API base URL

The base URL is baked into `BuildConfig.BASE_URL` at build time.

Defaults:

| Variant | URL                              |
|---------|----------------------------------|
| debug   | `http://10.0.2.2:3000/` (emulator → host loopback) |
| release | `https://www.margheritapizza.uk/` (canonical — avoids apex redirect that strips `Authorization`) |

To override either, add the following to `apps/admin-android/local.properties`
(this file is git-ignored):

```properties
# Overrides BOTH debug and release
margherita.baseUrl=https://staging.example.com/
```

Or set per-variant via `gradle.properties`:

```properties
margherita.baseUrl.debug=http://192.168.1.50:3000/
margherita.baseUrl.release=https://www.margheritapizza.uk/
```

> ⚠️ Cleartext HTTP traffic is enabled in the manifest so the emulator can reach the
> local dev server on `10.0.2.2`. Release builds should always target HTTPS.

## Build & run

```powershell
# From apps/admin-android (after generating the wrapper)
.\gradlew.bat :app:assembleDebug                  # builds debug APK
.\gradlew.bat :app:installDebug                   # installs to attached device/emulator
```

Open the app, sign in with a `users.role = admin` (or `staff`) account that already
exists in the Neon database.

## Authentication flow

1. `POST /api/mobile/admin/login` with `{ email, password }` returns
   `{ token, expiresAt, user }`. Token TTL: 30 days, signed with `NEXTAUTH_SECRET`.
2. The token is persisted in DataStore (`admin_session.preferences_pb`) and attached as
   `Authorization: Bearer …` on every subsequent request via `AuthInterceptor`.
3. Any non-login `401` response triggers a local sign-out and surfaces a snackbar.
4. `POST /api/mobile/admin/logout` is best-effort and stateless (no server-side
   revocation list).

## Backend impact

The Next.js codebase already supports NextAuth sessions for the web admin. For mobile
this PR adds:

- `lib/auth/mobile-token.ts` — `jose` HS256 sign/verify, 30-day TTL.
- `app/api/mobile/admin/{login,logout,me}/route.ts` — JSON envelope endpoints.
- `lib/auth/require-admin.ts` — accepts a `Authorization: Bearer …` token in addition
  to the existing NextAuth cookie session.

No database migrations are required and no new environment variables are introduced —
the existing `NEXTAUTH_SECRET` is reused.

## Project layout

```
app/src/main/java/uk/margheritapizzeria/admin/
├── MargheritaAdminApp.kt          # Application; constructs AppContainer
├── MainActivity.kt
├── core/
│   ├── AppContainer.kt            # manual DI
│   ├── config/                    # BuildConfig wrapper
│   ├── datastore/                 # SessionStore (DataStore)
│   ├── network/                   # ApiClient, interceptors, apiCall helper
│   ├── session/                   # SessionManager (AuthState + events)
│   └── ui/                        # theme, format helpers, shared components
├── navigation/AppNavGraph.kt
├── auth/                          # login screen + repository
├── dashboard/                     # admin dashboard tiles
├── orders/                        # list, detail, status updates
├── bookings/                      # list, detail, status updates
├── menu/                          # categories, items, availability, CRUD
├── settings/                      # general settings, time slots, tables
└── images/                        # URL-based image management
```

## FCM (future work)

To enable push notifications later:

1. Add the Firebase plugin and `google-services.json` (do **not** commit secrets).
2. Add a `FirebaseMessagingService` subclass under `core/notifications/` and register
   it in the manifest.
3. Implement an FCM token registration endpoint on the backend
   (the `fcm_tokens` table already exists).

The current code intentionally omits this so the build remains green without Firebase
credentials.

## What is **not** covered yet

- Image upload (the screen edits URLs only).
- Full opening-hours editor (uses single free-text fields per day).
- Admin user management (must be done via the web admin).
- Multi-device session revocation.
