import fs from "node:fs";
import path from "node:path";

const appGradlePath = "android/app/build.gradle";
const rootGradlePath = "android/build.gradle";
if (!fs.existsSync(appGradlePath) || !fs.existsSync(rootGradlePath)) throw new Error("Generated Android Gradle files are missing.");
let appGradle = fs.readFileSync(appGradlePath, "utf8");
let rootGradle = fs.readFileSync(rootGradlePath, "utf8");
const namespace = appGradle.match(/namespace\s+['"]([^'"]+)['"]/)?.[1];
if (!namespace) throw new Error("Android namespace not found.");

if (!rootGradle.includes("org.jetbrains.kotlin:kotlin-gradle-plugin")) {
  if (!/dependencies\s*\{/.test(rootGradle)) throw new Error("Root Gradle dependencies block not found.");
  rootGradle = rootGradle.replace(/dependencies\s*\{/, match => match + '\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21"');
  fs.writeFileSync(rootGradlePath, rootGradle);
}
// Keep the release APK lean while retaining the Capacitor plugin entry point.
if (/minifyEnabled\s+false/.test(appGradle)) appGradle = appGradle.replace(/minifyEnabled\s+false/, "minifyEnabled true");
if (/minifyEnabled\s+true/.test(appGradle) && !/shrinkResources\s+true/.test(appGradle)) {
  appGradle = appGradle.replace(/minifyEnabled\s+true/, "minifyEnabled true\n            shrinkResources true");
}
const proguardPath = "android/app/proguard-rules.pro";
const proguardRules = "\n# Capacitor discovers native plugins through their annotations.\n-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }\n-keep class **.YouTubeDownloadPlugin { *; }\n";
fs.appendFileSync(proguardPath, proguardRules);
fs.writeFileSync(appGradlePath, appGradle);

if (!appGradle.includes("kotlin-android")) {
  const pluginLine = /apply plugin:\s*['"]com\.android\.application['"]\s*/;
  if (!pluginLine.test(appGradle)) throw new Error("Android application plugin declaration not found.");
  appGradle = appGradle.replace(pluginLine, match => match + '\napply plugin: "kotlin-android"\n');
  fs.writeFileSync(appGradlePath, appGradle);
}

const javaDir = path.join("android/app/src/main/java", ...namespace.split("."));
fs.mkdirSync(javaDir, { recursive: true });
const plugin = fs.readFileSync("native/YouTubeDownloadPlugin.kt", "utf8").replace("__PACKAGE__", namespace);
fs.writeFileSync(path.join(javaDir, "YouTubeDownloadPlugin.kt"), plugin);

const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = fs.readFileSync(manifestPath, "utf8");
function ensureManifestPermission(permissionXml, permissionName) {
  if (manifest.includes(`android:name="${permissionName}"`)) return;
  const applicationTag = manifest.indexOf("<application");
  if (applicationTag < 0) throw new Error("AndroidManifest application tag not found.");
  manifest = manifest.slice(0, applicationTag) + "    " + permissionXml + "\n    " + manifest.slice(applicationTag);
}
ensureManifestPermission('<uses-permission android:name="android.permission.INTERNET" />', "android.permission.INTERNET");
// Legacy file-path writes are used only on Android 9 and below. Android 10+ uses MediaStore.
ensureManifestPermission('<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />', "android.permission.WRITE_EXTERNAL_STORAGE");
// Harden app data and transport defaults. The downloader needs HTTPS only.
const applicationTag = manifest.match(/<application\\b[^>]*>/);
if (!applicationTag) throw new Error("AndroidManifest application tag not found for security hardening.");
let hardenedApplicationTag = applicationTag[0];
if (!/\\bandroid:allowBackup=/.test(hardenedApplicationTag)) {
  hardenedApplicationTag = hardenedApplicationTag.replace("<application", '<application android:allowBackup="false"');
} else {
  hardenedApplicationTag = hardenedApplicationTag.replace(/android:allowBackup="[^"]*"/, 'android:allowBackup="false"');
}
if (!/\\bandroid:usesCleartextTraffic=/.test(hardenedApplicationTag)) {
  hardenedApplicationTag = hardenedApplicationTag.replace("<application", '<application android:usesCleartextTraffic="false"');
} else {
  hardenedApplicationTag = hardenedApplicationTag.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="false"');
}
manifest = manifest.replace(applicationTag[0], hardenedApplicationTag);
fs.writeFileSync(manifestPath, manifest);

const javaMain = path.join(javaDir, "MainActivity.java");
const ktMain = path.join(javaDir, "MainActivity.kt");
if (fs.existsSync(javaMain)) {
  let main = fs.readFileSync(javaMain, "utf8");
  if (!main.includes("YouTubeDownloadPlugin.class")) {
    main = main.replace("import com.getcapacitor.BridgeActivity;", "import com.getcapacitor.BridgeActivity;\nimport " + namespace + ".YouTubeDownloadPlugin;");
    main = main.replace(/public class MainActivity extends BridgeActivity\s*\{/, "public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(YouTubeDownloadPlugin.class);\n        super.onCreate(savedInstanceState);\n    }");
    fs.writeFileSync(javaMain, main);
  }
} else if (fs.existsSync(ktMain)) {
  let main = fs.readFileSync(ktMain, "utf8");
  if (!main.includes("YouTubeDownloadPlugin::class.java")) {
    main = main.replace("import com.getcapacitor.BridgeActivity", "import com.getcapacitor.BridgeActivity\nimport " + namespace + ".YouTubeDownloadPlugin");
    main = main.replace(/class MainActivity : BridgeActivity\(\)\s*\{/, "class MainActivity : BridgeActivity() {\n    override fun onCreate(savedInstanceState: android.os.Bundle?) {\n        registerPlugin(YouTubeDownloadPlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }");
    fs.writeFileSync(ktMain, main);
  }
} else {
  throw new Error("Capacitor MainActivity source not found.");
}
console.log("Installed minimal Kotlin YouTube stream downloader for " + namespace);
