# Nice Downloader

A focused, ad-free Android video and audio downloader.

## Only required components
- JavaScript + Vite: build the lightweight downloader interface.
- Capacitor Android/Core: Android application shell and native bridge.
- yt-dlp Android runtime: read supported media formats and download selected streams.
- FFmpeg support supplied by the downloader runtime/dependency graph when required to merge separate video and audio streams.
- GitHub Actions: build and publish the debug APK artifact.

No analytics, advertising SDKs, browser-launch helper, cookie-import UI, login manager, playlist manager, media player, file manager, or unrelated utility libraries are included.

## Download features
- Paste a supported HTTP/HTTPS media URL.
- Read available resolutions and formats from the source.
- Select the source-provided video resolution, including 4K when available.
- Download audio-only when the source provides an audio stream.
- Merge compatible video and audio streams when required by the selected format and bundled runtime.
- Show download progress and completion/failure status.
- Save completed files to Internal Storage / Download / NiceDownloader on Android 10+.

## Permissions and limits
The app uses internet access for media retrieval, Android foreground-service/notification permissions for background downloads, and Android MediaStore to publish completed files to Downloads. It does not bypass DRM, paywalls, or access controls. Download only content you own, are authorized to save, or that the source platform permits.

The available resolutions and formats depend on the source. The app cannot create a resolution that the source does not provide. Runtime compatibility, network restrictions, server limits, and platform changes can affect downloads.

## Build
```bash
npm install
npm run build
npx cap add android
node scripts/install-android-ytdlp.mjs
npx cap sync android
cd android && ./gradlew assembleDebug
```

GitHub Actions builds a debug APK on pushes to `main` and on manual workflow dispatch.
