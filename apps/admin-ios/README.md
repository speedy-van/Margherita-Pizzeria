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
or a signed device. The Debug config defaults `API_BASE_URL` to
`http://localhost:3000/` (override via the Login screen's "Server URL" field —
the value is persisted in Keychain).

## Backend
- Debug: `http://localhost:3000/`
- Release: `https://www.margheritapizza.uk/` (MUST be `www`, apex 308→www
  causes URLSession to drop the Authorization header on the redirect.)

The base URL is injected via `Info.plist` (`API_BASE_URL` build setting),
matching Android's `BuildConfig.BASE_URL`.

## Auth
- `POST /api/mobile/admin/login` returns `{ token, expiresAt, user }`.
- Token stored in Keychain (`uk.margheritapizzeria.admin.token`).
- `ApiClient` injects `Authorization: Bearer <token>` from `SessionManager`.
- Any `401` clears the session and emits `SessionEvent.signedOutRemotely`.

## Alerts (parity with admin-mobile)
- `BadgesController` polls `/api/admin/dashboard` every 8 s while signed in.
- Diffs `latestOrders`/`latestBookings` against a seen-set seeded on first
  poll, alerts only for `received`/`pending_payment` orders and `pending`
  bookings, but records every observed ID.
- Loops `new_order_alert.wav` via `AVAudioPlayer` until the dialog closes.
- Dialog has Dismiss + View actions; View deep-links via the global
  `RootRouter` to the relevant detail screen across tabs.

## Push notifications (APNs) — TODO
- Same status as Android: structurally ready (background mode set,
  `NSUserNotificationsUsageDescription` declared) but not wired to a
  backend service yet. Add Firebase iOS SDK + `/api/admin/devices` PUT
  with the APNs token when shipping.
