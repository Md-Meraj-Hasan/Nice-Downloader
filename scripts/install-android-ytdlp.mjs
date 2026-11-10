import fs from "node:fs";
import path from "node:path";

const gradlePath = "android/app/build.gradle";
if (!fs.existsSync(gradlePath)) throw new Error("Android app Gradle file not found");
let gradle = fs.readFileSync(gradlePath, "utf8");
if (!gradle.includes("dev.ffmpegkit-maintained:yt-dlp-android")) {
  const dependency = "    implementation 'dev.ffmpegkit-maintained:yt-dlp-android:2.0.2'\n";
  if (!gradle.includes("dependencies {")) throw new Error("Gradle dependencies block not found");
  gradle = gradle.replace("dependencies {", "dependencies {\n" + dependency);
  fs.writeFileSync(gradlePath, gradle);
}
const variablesPath = "android/variables.gradle";
if (fs.existsSync(variablesPath)) {
  let variables = fs.readFileSync(variablesPath, "utf8");
  variables = variables.replace(/minSdkVersion\s*=\s*23/g, "minSdkVersion = 24");
  fs.writeFileSync(variablesPath, variables);
}
const namespace = gradle.match(/namespace\s+['"]([^'"]+)['"]/ )?.[1];
if (!namespace) throw new Error("Android namespace not found");
const javaDir = path.join("android/app/src/main/java", ...namespace.split("."));
fs.mkdirSync(javaDir, { recursive: true });
const pluginSource = fs.readFileSync("native/YtDlpPlugin.java", "utf8").replace("__PACKAGE__", namespace);
fs.writeFileSync(path.join(javaDir, "YtDlpPlugin.java"), pluginSource);
const serviceSource = fs.readFileSync("native/DownloadForegroundService.java", "utf8").replace("__PACKAGE__", namespace);
fs.writeFileSync(path.join(javaDir, "DownloadForegroundService.java"), serviceSource);

// Compile the first Kotlin-native migration component in the generated project.
const rootGradlePath = "android/build.gradle";
if (!fs.existsSync(rootGradlePath)) throw new Error("Root Android Gradle file not found");
let rootGradle = fs.readFileSync(rootGradlePath, "utf8");
if (!rootGradle.includes("org.jetbrains.kotlin:kotlin-gradle-plugin")) {
  const buildscriptDependencies = /dependencies\s*\{/;
  if (!buildscriptDependencies.test(rootGradle)) throw new Error("Root Gradle buildscript dependencies block not found");
  rootGradle = rootGradle.replace(buildscriptDependencies, match => match + '\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21"');
  fs.writeFileSync(rootGradlePath, rootGradle);
}
if (!gradle.includes("kotlin-android")) {
  // Apply Kotlin after the Android application plugin is available.
  const androidPlugin = /apply plugin:\s*['"]com\\.android\\.application['"]\\s*/;
  if (!androidPlugin.test(gradle)) throw new Error("Android application plugin declaration not found");
  gradle = gradle.replace(androidPlugin, match => match + '\\napply plugin: "kotlin-android"\\n');
  fs.writeFileSync(gradlePath, gradle);
}
const routerSource = fs.readFileSync("native/NativePlatformRouter.kt", "utf8").replace("package __PACKAGE__", "package " + namespace);
fs.writeFileSync(path.join(javaDir, "NativePlatformRouter.kt"), routerSource);
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = fs.readFileSync(manifestPath, "utf8");
const permissions = [
  '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
  '    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />',
  '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
];
for (const permission of permissions) {
  const name = permission.match(/android:name="([^"]+)"/)[1];
  if (!manifest.includes(name)) manifest = manifest.replace("<application", permission + "\n    <application");
}
if (!manifest.includes("DownloadForegroundService")) {
  manifest = manifest.replace("</application>", '        <service android:name="' + namespace + '.DownloadForegroundService" android:exported="false" android:foregroundServiceType="dataSync" />\n    </application>');
}
if (!manifest.includes('android.permission.INTERNET')) {
  manifest = manifest.replace("<manifest", '<manifest');
  manifest = manifest.replace(/<application/, '    <uses-permission android:name="android.permission.INTERNET" />\n    <application');
  fs.writeFileSync(manifestPath, manifest);
} else {
  fs.writeFileSync(manifestPath, manifest);
}
const javaMain = path.join(javaDir, "MainActivity.java");
const ktMain = path.join(javaDir, "MainActivity.kt");
if (fs.existsSync(javaMain)) {
  let main = fs.readFileSync(javaMain, "utf8");
  if (!main.includes("YtDlpPlugin.class")) {
    main = main.replace("import com.getcapacitor.BridgeActivity;", "import com.getcapacitor.BridgeActivity;\nimport " + namespace + ".YtDlpPlugin;");
    main = main.replace(/public class MainActivity extends BridgeActivity\s*\{/, "public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(YtDlpPlugin.class);\n        super.onCreate(savedInstanceState);\n    }");
    fs.writeFileSync(javaMain, main);
  }
} else if (fs.existsSync(ktMain)) {
  let main = fs.readFileSync(ktMain, "utf8");
  if (!main.includes("YtDlpPlugin::class.java")) {
    main = main.replace("import com.getcapacitor.BridgeActivity", "import com.getcapacitor.BridgeActivity\nimport " + namespace + ".YtDlpPlugin");
    main = main.replace(/class MainActivity : BridgeActivity\(\)\s*\{/, "class MainActivity : BridgeActivity() {\n    override fun onCreate(savedInstanceState: android.os.Bundle?) {\n        registerPlugin(YtDlpPlugin::class.java)\n        super.onCreate(savedInstanceState)\n    }");
    fs.writeFileSync(ktMain, main);
  }
} else {
  throw new Error("Capacitor MainActivity source not found");
}
console.log("Installed native yt-dlp plugin for " + namespace);
