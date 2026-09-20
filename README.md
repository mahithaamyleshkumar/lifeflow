<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run LifeFlow

## Laptop

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set any required keys.
3. Run the app:
   `npm run dev`

Open http://localhost:3000.

## Android

The Android wrapper is generated in `android/` using Capacitor. Set `VITE_API_URL` in `.env.local` to the HTTPS URL where the LifeFlow Express server is deployed, then run:

```text
npm run android:sync
```

Open the project in Android Studio with `npm run android:open`, or build a debug APK from `android/` with `gradlew.bat assembleDebug`.
