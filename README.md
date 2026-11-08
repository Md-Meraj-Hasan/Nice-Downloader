# Nice Downloader

An ad-free Android media download manager project.

## Product rules
- Zero advertising: no AdMob, banner/interstitial/rewarded ads, promotional notifications, or advertising SDKs.
- No mandatory account.
- No hidden redirect/ad landing pages.
- Download only media you own, have permission to save, or that the source platform permits you to download.
- No DRM, paywall, or access-control bypass.

## Stack
- Vite + vanilla JavaScript UI
- Capacitor 7 Android shell
- GitHub Actions debug APK build

## Current milestone
This commit creates the responsive ad-free UI and Android build scaffold. Link validation is currently a UI check only; it does **not** extract or download media yet. Website extraction and reliable background downloads require a separate native integration and platform-by-platform compatibility tests. Never present a URL as downloadable until the extractor returns a valid permitted media stream.

## Local build
```bash
npm ci
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Build APK
Push to `main` or manually run the **Android APK** workflow in GitHub Actions. The workflow uploads a debug APK artifact.

## Ad-free verification
The app intentionally has no advertising dependencies or ad network configuration. Keep future dependencies free of advertising/analytics SDKs.
