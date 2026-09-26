# Ulan Watch

A real React Native (Expo) mobile app plus a Node/Express API, implementing the scope from the
Ulan Watch proposal: flood report submission with photo and water level, a live crowd-verified
map, confidence scoring, flood history, saved-location alerts, and coordinator moderation.

```
ulan-watch-app/
  backend/     Node.js + Express API, JSON file storage
  mobile/      Expo (React Native) app for Android/iOS
```

## 1. Requirements

- Node.js 18+ installed on your computer (https://nodejs.org)
- Expo Go for **SDK 57** on your phone (free, on Google Play / App Store)
- Your phone and computer connected to the **same Wi-Fi network**

You do **not** need Android Studio or Xcode to try the app — Expo Go runs it directly.
You only need Android Studio later, if you want to produce a standalone `.apk` yourself
(see step 5).

## 2. Run the backend

```bash
cd backend
npm install
npm start
```

You should see:

```
Ulan Watch API listening on http://0.0.0.0:4000
```

Find your computer's LAN IP address:
- **Windows:** open Command Prompt, run `ipconfig`, look for "IPv4 Address"
- **Mac:** run `ipconfig getifaddr en0` (or `en1` if you're on Wi-Fi via a dongle)
- **Linux:** run `hostname -I`

It will look like `192.168.1.10`. Keep this terminal window running.

## 3. Point the app at your backend

Set `EXPO_PUBLIC_API_URL` before starting Expo. On Windows PowerShell, for a local
backend, use your computer's LAN IP from step 2:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.10:4000'
```

Then start Expo in that same terminal. `localhost` will not work from a phone; use
your computer's LAN IP. If this variable is omitted, the app uses the development
fallback URL in `mobile/src/api.js`.

## 4. Run the mobile app

In a **new** terminal window:

```bash
cd mobile
npm install
npx expo start --tunnel
```

A QR code will appear in the terminal (and in a browser tab). On your phone:
- **Android:** open the Expo Go app and scan the QR code
- **iOS:** open the Camera app, point it at the QR code, tap the notification

The app will bundle and open on your phone. You can view the live flood map as a guest without signing in.
To submit a flood report, post a location, or attach a picture, create a resident account with your name,
email, and password, or sign in if you already have one. Only signed-in **resident** accounts can submit flood
reports — pin a spot on the map, pick a water level, and submit. Open the
app on a second phone (or have a classmate do the same) and submit a report near the same
spot to see it escalate from "Unverified" to "Likely" to "Verified".

## 5. Building a real .apk (optional, for your final submission)

Once you're happy with it, you can produce an installable Android package using
[Expo Application Services](https://docs.expo.dev/build/introduction/), which builds in
the cloud so you don't need Android Studio locally:

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

The app icon is bundled from `mobile/assets/icon.png`. Maps use OpenStreetMap tiles, so no
Google Maps API key or billing account is required. An old APK will keep its old icon and
native configuration, so uninstall it before testing the newly downloaded APK.

This uploads your project and gives you a download link for a real `.apk` you can install
on any Android phone or hand in as your deliverable. A free Expo account is required.

Before a production build, replace the demo backend URL with a real hosted server (see
below) since `192.168.x.x` only works while your phone and laptop share the same Wi-Fi.
Add `EXPO_PUBLIC_API_URL` to the EAS project's environment variables for the `preview`
and `production` environments, using the hosted API's HTTPS base URL (for example,
`https://api.your-domain.example`). This value is bundled into the app and is not a
secret. Build only after the variable is set; each new APK needs a new EAS build to
pick up a changed API URL.

## 6. What's a prototype simplification vs. the full proposal

This is built to be genuinely runnable by a student without cloud infrastructure, so a few
things are simplified from the proposal's production tech stack:

| Proposal | This build | Why |
|---|---|---|
| PostgreSQL + PostGIS | JSON file on the Express server | No native DB tooling required to run it. The confidence-scoring logic (`backend/confidence.js`) is the same haversine-distance clustering approach you'd implement in PostGIS with `ST_DWithin`. |
| Firebase Cloud Messaging push alerts | In-app alert banner, polls every 15s | Push notifications need a Firebase project, an Expo push token setup, and a paid Apple developer account for iOS — out of reach for a local demo. The polling banner demonstrates the same alert logic. |
| Google Maps API / route-avoidance | OpenStreetMap tiles via `react-native-maps` | No API key or billing account needed to run today. Swapping in the Google Maps provider is a config change in `app.json` once you have a key. |
| Verified-coordinator accounts | Admin-provisioned role in the local JSON store | Public registration creates resident accounts only; coordinator access is not self-selected. |
| Rainfall overlay (OpenWeatherMap) | Not included | Needs an API key; can be added as a tile overlay on `MapScreen.js` later. |

Everything else — report submission with photo + water level, the live map, multi-reporter
confidence scoring, flood history, saved-location alerts, and coordinator moderation — is
fully working end to end between the app and the API.

## 7. Troubleshooting

- **"Network Error" when submitting a report:** your phone can't reach the backend. Double-check
  `EXPO_PUBLIC_API_URL` is set to your computer's current IP before starting Expo, and that both
  devices are on the same Wi-Fi (not a "guest" network that isolates devices).
- **Expo complains about package version mismatches:** run `npx expo install --fix` inside
  `mobile/` to align versions with your installed Expo SDK.
- **Map fails to load after upgrading:** run `npm install` inside `mobile/`, then restart Expo with
  `npx expo start --clear --tunnel`. Maps use a WebView with OpenStreetMap tiles and do not need
  a Google Maps key.
- **Sign-in says it cannot reach the server:** stop and restart the backend (`cd backend; npm start`) after
  pulling these changes, then confirm `EXPO_PUBLIC_API_URL` is set in the same terminal used to start Expo.
- **Map doesn't render on Android:** confirm the phone has internet access because OpenStreetMap
  tiles load from the network. Restart the app after installing a newly built APK.
- **The downloaded APK closes immediately:** make sure you built a new APK after these changes,
  then uninstall the old APK before installing the new one. The app no longer requires a Google
  Maps API key.
