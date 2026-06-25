# Margherita Admin — iOS

Native SwiftUI port of `apps/admin-android`. Same screens, same backend endpoints,
same auth + alert flow.

## Stack
- SwiftUI, Swift 5.9
- iOS 16+ (iPhone + iPad)
- URLSession + Codable (`ApiClient`)
- Keychain for the 30-day JWT, UserDefaults for non-secret user info
- Manual DI (`AppContainer`) + MVVM (`@MainActor` ObservableObject view models)
- Polling-based real-time alerts (8 s, mirrors `admin-mobile`)

## Project layout
```
apps/admin-ios/
├── project.yml                # XcodeGen spec — generates .xcodeproj
├── MargheritaAdmin/
│   ├── Info.plist
│   ├── Resources/
│   │   ├── Assets.xcassets/   # AppIcon, AccentColor, theme colors, splash bg
│   │   └── Sounds/            # new_order_alert.wav (drop in before release)
│   ├── App/                   # entry, root view, container
│   ├── Core/                  # network, session, theme, format, components
│   ├── Features/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Orders/
│   │   ├── Bookings/
│   │   ├── Menu/
│   │   ├── Settings/
│   │   ├── Images/
│   │   └── Discounts/
│   └── Navigation/
└── README.md
```

Each feature mirrors Android's MVVM split: `Api.swift` (URL bindings),
`Repository.swift` (wrapper), `Models.swift` (DTOs), `*View.swift` (SwiftUI),
`*ViewModel.swift` (state + reducers).

## Prerequisites
- macOS, Xcode 15+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`

## Build
```bash
cd apps/admin-ios
xcodegen generate
open MargheritaAdmin.xcodeproj
```

Then in Xcode: select the `MargheritaAdmin` scheme and run on a simulator
or a signed device.

## Backend
- Debug: `https://www.margheritapizza.uk/`
- Release: `https://www.margheritapizza.uk/` (MUST be `www`, apex 308→www
  causes URLSession to drop the Authorization header on the redirect.)

The base URL is injected via `Info.plist` (`API_BASE_URL` build setting),
matching Android's `BuildConfig.BASE_URL`.

## Auth
- `POST /api/mobile/admin/login` returns `{ token, expiresAt, user }`.
- `POST /api/mobile/admin/auth/forgot-password` returns a generic success
  message and sends reset email when the account exists.
- Token stored in Keychain (`uk.margheritapizzeria.admin.token`).
- `ApiClient` injects `Authorization: Bearer <token>` from `SessionManager`.
- Any `401` clears the session and emits `SessionEvent.signedOutRemotely`.

## App Store review demo
- Review email: `review@margheritapizza.uk`
- Review password: `AppleReview2026!`
- This sign-in opens local demo data for Apple Review only. It does not mutate
  production orders, bookings, menu items, images, discounts, or settings.

## Alerts (parity with admin-mobile)
- `BadgesController` polls `/api/admin/dashboard` every 8 s while signed in.
- Diffs `latestOrders`/`latestBookings` against a seen-set seeded on first
  poll, alerts only for `received`/`pending_payment` orders and `pending`
  bookings, but records every observed ID.
- Loops `new_order_alert.wav` via `AVAudioPlayer` until the dialog closes.
- Dialog has Dismiss + View actions; View deep-links via the global
  `RootRouter` to the relevant detail screen across tabs.

## Push notifications (APNs) — TODO
- Not wired to a backend service yet. Add APNs/Firebase iOS wiring plus
  `/api/admin/devices` token registration before enabling remote push.
- Keep remote-notification background mode disabled until APNs is implemented
  and validated end-to-end.

## App Store Review checklist (first submission)
- Build and upload a `Release` archive only (never Debug/Test URLs).
- Verify login works against `https://www.margheritapizza.uk/`.
- Provide a working review account in App Store Connect notes:
  - email
  - password
  - any 2FA bypass steps (if applicable)
- Add clear reviewer steps in notes:
  - sign in
  - (optional) tap `Forgot password?` and submit review email to verify reset flow
  - open Orders and Bookings
  - change one status in each section
  - sign out from More tab
- If backend is IP-restricted, allow Apple's review IPs or provide a temporary review environment.
- Confirm no placeholder text/screenshots/icons remain.
- Confirm Privacy Policy URL is set in App Store Connect and reachable without login.
- Set App Privacy answers in App Store Connect to match actual behavior:
  - account identifiers (admin email)
  - app functionality / diagnostics only if collected server-side
  - no tracking unless you actually track across apps/websites
- Ensure notification permission prompt appears in a valid flow (after sign-in) and app remains usable if denied.
- If notifications are not required for core review flow, mention this in review notes.
- Verify `ITSAppUsesNonExemptEncryption=false` remains accurate (no custom/proprietary crypto beyond system TLS/Keychain).
- Test on a fresh physical device install:
  - first launch
  - login/logout cycle
  - network loss and recovery
  - foreground/background transitions
