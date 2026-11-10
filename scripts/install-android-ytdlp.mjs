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
if (!manifest.includes("android.permission.INTERNET")) {
  manifest = manifest.replace("<application", '    <uses-permission android:name="android.permission.INTERNET" />\n    <application');
}
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
