# Nice Downloader

A private, ad-free Android media downloader.

## Product guarantees
- Zero ads: no AdMob, banners, interstitials, rewarded ads, advertising SDKs, or promotional notifications.
- No mandatory account and no cloud download server.
- No advertising redirects or forced landing pages.
- No DRM, paywall, or access-control bypass. Download only media you own, have permission to save, or that the source platform expressly permits.

## Technology
- Vite + JavaScript interface
- Capacitor 7 Android shell
- On-device yt-dlp Android library (MIT wrapper; yt-dlp and bundled components retain their own notices)
- GitHub Actions debug APK build

## Current implementation
- Premium dark / light theme toggle
- URL validation and quality preset selector
- Native on-device yt-dlp download bridge
- Live progress events and completion/failure status
- Faster HLS/DASH downloads using 8 concurrent fragments, with retries, socket timeout, and a larger I/O buffer
- Output is currently stored in the app-specific external Downloads/NiceDownloader folder. A later storage milestone will add a user-selected public Downloads folder and download history.

## Supported quality presets
- Best available
- Up to 1080p / 720p / 480p (only if the source provides a compatible format)
- Audio-only source stream

Speed depends on the source server, selected format, device, and network. Parallel fragments can improve HLS/DASH downloads when the source supports them; ordinary single-stream HTTP downloads may not become faster. The app cannot defeat Wi-Fi firewalls, ISP throttling, server rate limits, or blocked domains, and it does not attempt to bypass network access controls. Use a network and source you are authorized to access. Actual website compatibility changes over time. A platform may require an authorized session, may block a particular Android runtime, or may prohibit downloads. The free yt-dlp Android runtime does not include browser TLS impersonation; some sites may therefore fail. No guarantee is made that every link or every resolution works.

## Device requirements
The bundled yt-dlp Android runtime currently supports arm64-v8a and x86_64. It does not support 32-bit-only ARM devices. The embedded runtime increases APK size substantially (roughly 60–80 MB before other app content).

## Local build
```bash
npm install
npm run build
npx cap add android
node scripts/install-android-ytdlp.mjs
npx cap sync android
cd android && ./gradlew assembleDebug
```

## GitHub Actions
Every push to `main` or manual workflow dispatch builds a debug APK and uploads it as `Nice-Downloader-debug-apk`.

## Ad-free dependency policy
Do not add ad networks, advertising SDKs, analytics trackers, or promotional notification services. Review new dependencies and their transitive dependencies before merging.
