import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.meraj.nicedownloader",
  appName: "Nice Downloader",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: false }
};
export default config;
