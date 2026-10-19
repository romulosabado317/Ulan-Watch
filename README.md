# Ulan Watch

A real React Native (Expo) mobile app plus a Node/Express API, implementing the scope from the
Ulan Watch proposal: flood report submission with photo and water level, a live crowd-verified
map, confidence scoring, flood history, saved-location alerts, and coordinator moderation.

```
ulan-watch-app/
  backend/     Node.js + Express API, PostgreSQL and Supabase Storage
  mobile/      Expo (React Native) app for Android/iOS
```

## 1. Production deployment

The APK can be installed on other Android phones and uses the hosted API over HTTPS. This project
uses Supabase for PostgreSQL and report-photo storage, Render for the Express API, and EAS Build
to produce the APK. For a public production service, choose always-on hosting and a database plan
with backups; free tiers are suitable for testing but can sleep, pause, or lack uptime guarantees.
Check current plan limits and pricing before launch.

The old local `backend/db.json` demo data is not imported automatically. If it contains reports or
accounts you need, back it up and plan a separate migration before switching users to production.

### Create the database and photo bucket

1. Create a Supabase project.
2. In **SQL Editor**, run the contents of `backend/schema.sql`.
3. In **Storage**, create a public bucket named `flood-reports` for report images.
4. In **Project Settings > API**, copy the project URL and the `service_role` key. Keep the service
  key private; it belongs only in the backend host, never in the mobile app.
5. Copy the PostgreSQL connection string from **Project Settings > Database**. Use the session
  pooler connection if your host cannot reach Supabase's direct IPv6 connection.

### Deploy the API

1. Push this repository to a private GitHub repository and create a **Web Service** on Render from it.
2. Set the service root directory to `backend`, runtime to Node, and build command to `npm install`.
  Set the start command to `npm start`.
3. Add these Render environment variables from your Supabase project:
  `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`
  (set the last value to `flood-reports`). Never commit real values.
4. Deploy. Open `https://YOUR-SERVICE.onrender.com/api/health`; it should return JSON with `"ok":true`.
  The health route checks the database connection, so a failed result means the database URL or
  schema still needs attention.

### Build and share the APK

1. In the EAS project, add `EXPO_PUBLIC_API_URL` to the **production** environment with the API's
  HTTPS base URL, such as `https://YOUR-SERVICE.onrender.com` (no `/api` suffix).
2. From `mobile/`, run `npm install -g eas-cli`, `eas login`, and `eas build:configure` if EAS has
  not been configured for this project yet.
3. Build the release APK with `eas build --platform android --profile production`.
4. When the EAS build finishes, open its build page and download the APK. Send that APK to another
  Android device; enable installation from that source if Android asks. The app uses the HTTPS API
  URL embedded at build time, so rebuild after changing the URL.
5. Test on a different network (for example, mobile data): register, sign in, submit a report, then
  verify it appears on another phone. Keep the Render service and Supabase project active.

The production APK is for direct Android installation. Publishing through Google Play is a separate
release process and generally uses an Android App Bundle (`.aab`), not this sideloadable APK.

## 2. Local development

Node.js 18+ is required. Create a Supabase project and run `backend/schema.sql` as above. In
`backend/`, copy `.env.example` to `.env` and fill in your database and Supabase storage values.
Then run:

```bash
npm install
npm start
```

For Expo Go local development, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP and port 4000
before starting Expo. On Windows PowerShell, for example:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.10:4000'
cd ..\mobile
npm install
npx expo start --tunnel
```

Your phone must be able to reach that computer on the network. For a downloadable APK, use the
hosted HTTPS address in EAS instead. Never use `localhost` or a `192.168.x.x` URL in a shared APK.

## 3. Notes

- The API stores reports, accounts, and hashed session tokens in PostgreSQL. Photos are stored in
  the Supabase Storage bucket; the database stores each photo URL.
- New account registration always creates a resident. Coordinator roles must be provisioned by an
  administrator directly in the database.
- Push alerts, rainfall overlays, and route-avoidance are not included. In-app alerts poll the API.
- OpenStreetMap tiles do not require a Google Maps API key.



Hi im Romulo