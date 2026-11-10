# Nice Downloader

A lightweight, ad-free Android YouTube downloader.

## Platform and privacy
- YouTube links only; Facebook and Instagram are not supported.
- No ads, analytics SDKs, mandatory account, or cloud download server.
- No DRM, paywall, private-content, or access-control bypass.
- Download only content you own or are authorized to save.

## Technology
- Vite + JavaScript interface
- Capacitor 7 Android shell
- YouTube.js (MIT) for public YouTube stream information
- Minimal Kotlin Android bridge for downloading selected direct media streams
- GitHub Actions builds the APK

## Features
- Existing premium interface, quality selection, progress display, and Downloads tab retained.
- Available combined audio/video streams are offered as video choices.
- Audio-only stream is offered when YouTube provides one.
- Files are saved to Download/NiceDownloader on supported Android versions.

## Size policy
The app intentionally avoids Python, Chaquopy, yt-dlp, FFmpeg, and large native binaries. The build workflow reports the actual APK size; no size guarantee is made before measuring the generated artifact. Device ABI, Android/Capacitor runtime, and bundled JavaScript affect the final size.

## Build
```bash
npm install
npm run build
npx cap add android
node scripts/install-android-native.mjs
npx cap sync android
cd android && ./gradlew assembleDebug
```

## License notes
YouTube.js is MIT-licensed. Capacitor and transitive dependencies retain their respective licenses; consult their notices before redistribution.
