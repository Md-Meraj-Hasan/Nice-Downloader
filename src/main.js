import "./style.css";
import { registerPlugin, Capacitor } from "@capacitor/core";

const YtDlp = registerPlugin("YtDlp");
const app = document.querySelector("#app");
app.innerHTML = `
  <header class="top"><div class="brand"><div class="logo">N</div><div><b>Nice Downloader</b><small>Private • Fast • Ad-free</small></div></div><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">☼</button></header>
  <main>
    <section class="hero"><div class="eyebrow">YOUR DOWNLOAD SPACE</div><h1>Save what<br><span>matters.</span></h1><p>Paste a media link to check available download options.</p></section>
    <section class="panel">
      <label for="urlInput">VIDEO OR MEDIA LINK</label>
      <div class="urlbox"><input id="urlInput" type="url" placeholder="Paste a link here…" autocomplete="url"><button id="pasteBtn" class="paste">Paste</button></div>
      <div class="quality-row"><label for="quality">QUALITY / FORMAT</label><select id="quality"><option value="best">Best available</option><option value="1080">Up to 1080p</option><option value="720">Up to 720p</option><option value="480">Up to 480p</option><option value="audio">Audio only (source format)</option></select></div>
      <button id="inspectBtn" class="primary"><span>↓</span> Start download</button>
      <p class="hint" id="status" role="status">Only download content you own or are authorized to save.</p>
      <button id="browserBtn" class="browser-fallback" hidden>Open this link in Chrome / browser</button>
      <div class="progress-wrap" id="progressWrap" hidden><div class="progress-head"><span id="progressLabel">Preparing…</span><b id="progressValue">0%</b></div><div class="progress-track"><div id="progressBar"></div></div></div>
    </section>
    <section class="supported"><div class="section-title">POPULAR SOURCES</div><div class="sources"><span>▶ YouTube</span><span>f Facebook</span><span>◎ Instagram</span><span>♪ TikTok</span><span>𝕏 X</span><span>＋ More sites</span></div><p class="hint">Supported sites depend on the bundled yt-dlp extractor and each platform's current access rules.</p></section>
    <section class="panel options"><div class="section-title">DOWNLOAD MANAGER</div><div class="empty" id="downloadState"><div class="empty-icon">⇩</div><b>Ready for your first download</b><small>Progress will appear here while downloading.</small></div></section>
  </main>
  <footer>NO ADS · NO TRACKERS · NO ACCOUNT REQUIRED</footer>
`;

const input = document.querySelector("#urlInput");
const status = document.querySelector("#status");
const button = document.querySelector("#inspectBtn");
const progressWrap = document.querySelector("#progressWrap");
const progressBar = document.querySelector("#progressBar");
const progressValue = document.querySelector("#progressValue");
const progressLabel = document.querySelector("#progressLabel");
const downloadState = document.querySelector("#downloadState");\nconst browserBtn = document.querySelector("#browserBtn");
let progressListener;

document.querySelector("#pasteBtn").addEventListener("click", async () => {
  try { input.value = await navigator.clipboard.readText(); status.textContent = input.value ? "Link pasted. Tap Start download." : "Clipboard is empty."; }
  catch { status.textContent = "Clipboard access unavailable. Paste the link manually."; }
});
document.querySelector("#inspectBtn").addEventListener("click", async () => {
  let url;
  try { url = new URL(input.value.trim()); } catch { status.textContent = "Please enter a valid http or https link."; return; }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) { status.textContent = "Only valid http and https links are accepted."; return; }
  if (!Capacitor.isNativePlatform()) { status.textContent = "Native downloader is available in the Android APK. This web preview cannot download media."; return; }
  button.disabled = true;
  button.textContent = "Starting download…";
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressValue.textContent = "0%";
  progressLabel.textContent = "Connecting to source…";
  status.textContent = "Downloading on this device. Keep the app available until the task completes.";
  downloadState.innerHTML = "<b>Download in progress</b><small>See live progress above.</small>";
  try {
    if (!progressListener) {
      progressListener = await YtDlp.addListener("downloadProgress", event => {
        const pct = Math.max(0, Math.min(100, Number(event.progress) || 0));
        progressBar.style.width = pct + "%";
        progressValue.textContent = Math.round(pct) + "%";
        progressLabel.textContent = event.etaSeconds > 0 ? "Downloading · ETA " + event.etaSeconds + "s" : "Downloading…";
      });
    }
    const result = await YtDlp.download({ url: url.href, quality: document.querySelector("#quality").value });
    progressBar.style.width = "100%";
    progressValue.textContent = "100%";
    progressLabel.textContent = "Completed";
    status.textContent = "Download completed. Saved in the app's NiceDownloader folder.";
    downloadState.innerHTML = "<b>Download completed</b><small>Location: " + String(result.folder || "App Downloads") + "</small>";
  } catch (error) {
    const message = error?.message || String(error);
    status.textContent = "Download failed: " + message;
    progressLabel.textContent = "Download failed";
    downloadState.innerHTML = "<b>Could not complete this download</b><small>If this office network permits the site in Chrome, try opening the same link in your approved browser.</small>";\n    browserBtn.hidden = false;
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>↓</span> Start download";
  }
});
document.querySelector("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  document.querySelector('meta[name="theme-color"]').content = document.body.classList.contains("light") ? "#f3f5fa" : "#090d18";
});
