import "./style.css";
import { registerPlugin, Capacitor } from "@capacitor/core";

const YtDlp = registerPlugin("YtDlp");
const app = document.querySelector("#app");

app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <button class="menu-btn" id="menuBtn" aria-label="Open menu"><span></span><span></span><span></span></button>
    <div class="brand"><div class="logo">N</div><div><b>Nice Downloader</b><small>FAST · PRIVATE · AD-FREE</small></div></div>
    <button class="theme-btn" id="themeBtn" aria-label="Toggle theme">☼</button>
  </header>
  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="drawer" id="drawer" aria-label="Main menu" aria-hidden="true">
    <div class="drawer-head"><div class="logo">N</div><div><b>Nice Downloader</b><small>Main menu</small></div><button id="closeMenu" class="close-btn">×</button></div>
    <button class="drawer-link active" data-tab="home"><span>⌂</span> Home</button>
    <button class="drawer-link" data-tab="downloads"><span>⇩</span> Downloads</button>
    <button class="drawer-link" data-tab="browser"><span>◎</span> Browser</button>
    <button class="drawer-link" data-tab="settings"><span>⚙</span> Settings</button>
    <div class="drawer-foot">NO ADS · NO TRACKERS</div>
  </aside>
  <main class="stage">
    <section class="page active" id="page-home">
      <div class="welcome-row"><div><div class="eyebrow">YOUR DOWNLOAD SPACE</div><h1>Download <span>anything.</span></h1><p>Fast, simple and private downloads.</p></div><div class="speed-orb">↯</div></div>
      <div class="download-card">
        <div class="card-title"><span class="title-icon">↓</span><div><b>New download</b><small>Paste your media link below</small></div></div>
        <label for="urlInput">MEDIA URL</label>
        <div class="urlbox"><input id="urlInput" type="url" placeholder="https://example.com/video" autocomplete="url"><button id="pasteBtn" class="paste">Paste</button></div>
        <div class="quality-row"><label for="quality">QUALITY</label><select id="quality"><option value="best">Best available</option><option value="1080">Up to 1080p</option><option value="720">Up to 720p</option><option value="480">Up to 480p</option><option value="audio">Audio only</option></select></div>
        <button id="downloadBtn" class="primary"><span>↓</span> Start download</button>
        <p class="status" id="status" role="status">Download only content you own or are allowed to save.</p>
        <button id="browserBtn" class="browser-fallback" hidden>Open link in Chrome / browser ↗</button>
        <div class="progress-wrap" id="progressWrap" hidden><div class="progress-head"><span id="progressLabel">Connecting…</span><b id="progressValue">0%</b></div><div class="progress-track"><div id="progressBar"></div></div></div>
      </div>
      <div class="quick-row"><div class="quick-card"><span>⚡</span><b>Fast engine</b><small>Parallel fragments</small></div><div class="quick-card"><span>◈</span><b>Private</b><small>On-device</small></div><div class="quick-card"><span>◇</span><b>Ad-free</b><small>No ads</small></div></div>
    </section>
    <section class="page" id="page-downloads">
      <div class="page-heading"><div class="eyebrow">YOUR LIBRARY</div><h2>Downloads</h2><p>Current download activity and recent status.</p></div>
      <div class="download-card manager-card" id="downloadState"><div class="empty-icon">⇩</div><b>No downloads yet</b><small>Your download status will appear here.</small></div>
    </section>
    <section class="page" id="page-browser">
      <div class="page-heading"><div class="eyebrow">BROWSER HANDOFF</div><h2>Open in browser</h2><p>Continue in your device's approved browser.</p></div>
      <div class="download-card">
        <div class="card-title"><span class="title-icon">◎</span><div><b>Open a website</b><small>Use Chrome or your default browser</small></div></div>
        <label for="browserUrl">WEBSITE LINK</label>
        <div class="urlbox"><input id="browserUrl" type="url" placeholder="https://example.com" autocomplete="url"></div>
        <button id="openBrowserBtn" class="primary">Open in browser ↗</button>
        <p class="status">Network restrictions remain controlled by your organization.</p>
      </div>
    </section>
    <section class="page" id="page-settings">
      <div class="page-heading"><div class="eyebrow">PREFERENCES</div><h2>Settings</h2><p>Appearance and download information.</p></div>
      <div class="download-card settings-list">
        <div class="setting-row"><div><b>Appearance</b><small>Switch dark / light theme</small></div><button id="settingsThemeBtn" class="setting-action">Toggle</button></div>
        <div class="setting-row"><div><b>Download engine</b><small>yt-dlp · On-device processing</small></div><span class="setting-value">Native</span></div>
        <div class="setting-row"><div><b>Network</b><small>Parallel fragments and retries</small></div><span class="setting-value">Optimized</span></div>
        <div class="setting-row"><div><b>Privacy</b><small>No ad SDK or cloud download server</small></div><span class="setting-value good">Ad-free</span></div>
      </div>
    </section>
  </main>
  <nav class="bottom-nav" aria-label="Main sections">
    <button class="nav-item active" data-tab="home"><span>⌂</span><small>Home</small></button>
    <button class="nav-item" data-tab="downloads"><span>⇩</span><small>Downloads</small></button>
    <button class="nav-item" data-tab="browser"><span>◎</span><small>Browser</small></button>
    <button class="nav-item" data-tab="settings"><span>⚙</span><small>Settings</small></button>
  </nav>
</div>`;

const $ = selector => document.querySelector(selector);
const input = $("#urlInput"), status = $("#status"), button = $("#downloadBtn");
const browserBtn = $("#browserBtn"), progressWrap = $("#progressWrap");
const progressBar = $("#progressBar"), progressValue = $("#progressValue"), progressLabel = $("#progressLabel");
const downloadState = $("#downloadState");
let progressListener = null;

function switchTab(tab) {
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === "page-" + tab));
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item.dataset.tab === tab));
  closeDrawer();
}
function openDrawer() {
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#drawerBackdrop").hidden = false;
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#drawerBackdrop").hidden = true;
}
function toggleTheme() {
  document.body.classList.toggle("light");
  document.querySelector('meta[name="theme-color"]').content = document.body.classList.contains("light") ? "#f3f5fa" : "#090d18";
}
function validWebUrl(value) {
  try { const url = new URL(value.trim()); return ["http:", "https:"].includes(url.protocol) && url.hostname ? url : null; }
  catch { return null; }
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

$("#menuBtn").addEventListener("click", openDrawer);
$("#closeMenu").addEventListener("click", closeDrawer);
$("#drawerBackdrop").addEventListener("click", closeDrawer);
document.querySelectorAll("[data-tab]").forEach(item => item.addEventListener("click", () => switchTab(item.dataset.tab)));
$("#themeBtn").addEventListener("click", toggleTheme);
$("#settingsThemeBtn").addEventListener("click", toggleTheme);

$("#pasteBtn").addEventListener("click", async () => {
  try { input.value = await navigator.clipboard.readText(); status.textContent = input.value ? "Link pasted. Ready to download." : "Clipboard is empty."; }
  catch { status.textContent = "Clipboard unavailable. Paste your link manually."; }
});
$("#openBrowserBtn").addEventListener("click", async () => {
  const url = validWebUrl($("#browserUrl").value);
  if (!url) { $("#browserUrl").focus(); return; }
  if (Capacitor.isNativePlatform()) {
    try { await YtDlp.openInBrowser({url:url.href}); }
    catch (error) { status.textContent = error?.message || "Could not open browser."; }
  } else window.open(url.href, "_blank", "noopener");
});
browserBtn.addEventListener("click", async () => {
  const url = validWebUrl(input.value);
  if (!url) return;
  try { await YtDlp.openInBrowser({url:url.href}); }
  catch (error) { status.textContent = "Could not open browser: " + (error?.message || error); }
});

button.addEventListener("click", async () => {
  const url = validWebUrl(input.value);
  if (!url) { status.textContent = "Please enter a valid http or https link."; input.focus(); return; }
  if (!Capacitor.isNativePlatform()) { status.textContent = "Native downloading is available in the Android APK. Use the Browser tab for web links."; return; }
  browserBtn.hidden = true;
  button.disabled = true;
  button.textContent = "Starting…";
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressValue.textContent = "0%";
  progressLabel.textContent = "Connecting to source…";
  status.textContent = "Downloading on this device. Keep the app available.";
  downloadState.innerHTML = '<div class="empty-icon">↯</div><b>Download in progress</b><small>Live progress is shown on Home.</small>';
  try {
    if (!progressListener) {
      progressListener = await YtDlp.addListener("downloadProgress", event => {
        const pct = Math.max(0, Math.min(100, Number(event.progress) || 0));
        progressBar.style.width = pct + "%";
        progressValue.textContent = Math.round(pct) + "%";
        progressLabel.textContent = event.etaSeconds > 0 ? "Downloading · ETA " + event.etaSeconds + "s" : "Downloading…";
      });
    }
    const result = await YtDlp.download({url:url.href,quality:$("#quality").value});
    progressBar.style.width = "100%";
    progressValue.textContent = "100%";
    progressLabel.textContent = "Completed";
    status.textContent = "Download completed. Saved in the NiceDownloader app folder.";
    downloadState.innerHTML = '<div class="empty-icon success-icon">✓</div><b>Download completed</b><small>' + escapeText(result.folder || "Saved in app Downloads") + '</small>';
  } catch (error) {
    const message = error?.message || String(error);
    status.textContent = "Download failed: " + message;
    progressLabel.textContent = "Download failed";
    downloadState.innerHTML = '<div class="empty-icon error-icon">!</div><b>Could not complete download</b><small>' + escapeText(message) + '</small>';
    browserBtn.hidden = false;
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>↓</span> Start download";
  }
});
