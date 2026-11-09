import "./style.css";
import { registerPlugin, Capacitor } from "@capacitor/core";

const YtDlp = registerPlugin("YtDlp");
const app = document.querySelector("#app");

const icon = (name) => {
  const paths = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2"/>',
    browser:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8z"/>',
    paste:'<rect x="8" y="3" width="12" height="15" rx="2"/><path d="M5 7H4a1 1 0 0 0-1 1v13h12a1 1 0 0 0 1-1v-1"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/>',
    video:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3z"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    playlist:'<path d="M4 6h16M4 12h10M4 18h7"/><path d="m17 15 4 3-4 3z"/>',
    speed:'<path d="M3 17a9 9 0 1 1 18 0"/><path d="m12 13 4-4M6 17h12"/>',
    shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>'
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.download)+'</svg>';
};

app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Open menu">${icon("menu")}</button>
    <div class="brand"><div class="brand-mark"><span></span></div><div class="brand-copy"><b>Nice Downloader</b><small>FAST · PRIVATE · AD-FREE</small></div></div>
    <button class="icon-btn theme-btn" id="themeBtn" aria-label="Toggle theme">${icon("sun")}</button>
  </header>

  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="drawer" id="drawer" aria-label="Main menu" aria-hidden="true">
    <div class="drawer-head"><div class="brand-mark"><span></span></div><div><b>Nice Downloader</b><small>Your media companion</small></div><button id="closeMenu" class="icon-btn close-btn" aria-label="Close menu">${icon("close")}</button></div>
    <div class="drawer-label">WORKSPACE</div>
    <button class="drawer-link active" data-tab="home">${icon("home")} Home</button>
    <button class="drawer-link" data-tab="downloads">${icon("download")} Downloads</button>
    <button class="drawer-link" data-tab="browser">${icon("browser")} Browser</button>
    <div class="drawer-label drawer-label-lower">PREFERENCES</div>
    <button class="drawer-link" data-tab="settings">${icon("settings")} Settings</button>
    <div class="drawer-foot"><span class="online-dot"></span> PRIVATE · ON-DEVICE</div>
  </aside>

  <main class="stage">
    <section class="page active" id="page-home">
      <div class="hero-banner">
        <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-dot"></span> ALL MEDIA DOWNLOADER</div><h1>Your media.<br><span>Your way.</span></h1><p>Video · Audio · Playlists · Fast &amp; simple</p></div>
        <div class="hero-art"><div class="hero-ring"></div><div class="hero-download">${icon("download")}</div><div class="hero-play">▶</div></div>
        <div class="hero-glow"></div>
      </div>

      <div class="section-heading"><div><span class="section-kicker">GET STARTED</span><h2>New download</h2></div><span class="secure-chip">${icon("shield")} On-device</span></div>
      <div class="download-card">
        <label for="urlInput">PASTE YOUR MEDIA LINK</label>
        <div class="urlbox"><span class="url-icon">${icon("link")}</span><input id="urlInput" type="url" placeholder="Paste video or audio link here…" autocomplete="url"><button id="pasteBtn" class="paste-btn" aria-label="Paste from clipboard">${icon("paste")}</button></div>
        <div class="quality-row"><label for="quality">QUALITY</label><select id="quality"><option value="best">Best available</option><option value="1080">Up to 1080p</option><option value="720">Up to 720p</option><option value="480">Up to 480p</option><option value="audio">Audio only</option></select></div>
        <button id="downloadBtn" class="primary"><span class="primary-icon">${icon("download")}</span> Download now <span class="button-arrow">→</span></button>
        <p class="status" id="status" role="status">Only download content you own or are allowed to save.</p>
        <button id="browserBtn" class="browser-fallback" hidden>Open link in Chrome / browser ↗</button>
        <div class="progress-wrap" id="progressWrap" hidden><div class="progress-head"><span id="progressLabel">Connecting…</span><b id="progressValue">0%</b></div><div class="progress-track"><div id="progressBar"></div></div></div>
      </div>

      <div class="section-heading tools-heading"><div><span class="section-kicker">BUILT FOR EVERYDAY USE</span><h2>Quick tools</h2></div></div>
      <div class="tools-grid">
        <div class="tool-tile tile-video"><span class="tool-icon">${icon("video")}</span><b>Video</b><small>Media download</small></div>
        <div class="tool-tile tile-audio"><span class="tool-icon">${icon("music")}</span><b>Audio</b><small>Audio-only source</small></div>
        <div class="tool-tile tile-playlist"><span class="tool-icon">${icon("playlist")}</span><b>Playlist</b><small>Supported links</small></div>
        <div class="tool-tile tile-quality"><span class="tool-icon">4K</span><b>HD quality</b><small>Up to 1080p</small></div>
        <div class="tool-tile tile-speed"><span class="tool-icon">${icon("speed")}</span><b>Fast engine</b><small>Parallel fragments</small></div>
        <div class="tool-tile tile-private"><span class="tool-icon">${icon("shield")}</span><b>Private</b><small>On your device</small></div>
      </div>
      <div class="platform-strip"><div class="platform-title"><b>Made for your links</b><small>Paste a supported URL to begin</small></div><div class="platform-symbols"><span class="platform-youtube">▶</span><span class="platform-video">${icon("video")}</span><span class="platform-music">${icon("music")}</span><span class="platform-more">•••</span></div></div>
    </section>

    <section class="page" id="page-downloads">
      <div class="page-heading"><div class="eyebrow"><span class="eyebrow-dot"></span> YOUR LIBRARY</div><h2>Downloads</h2><p>Track the current download and latest result.</p></div>
      <div class="download-stats"><div><span class="stat-icon purple">${icon("download")}</span><b id="downloadCount">0</b><small>Sessions</small></div><div><span class="stat-icon cyan">${icon("speed")}</span><b id="downloadStatus">Ready</b><small>Latest status</small></div></div>
      <div class="download-card manager-card" id="downloadState"><div class="empty-illustration">${icon("download")}</div><b>No downloads yet</b><small>Your download activity will appear here.</small></div>
      <p class="storage-note">${icon("shield")} Files are saved in the Nice Downloader app folder.</p>
    </section>

    <section class="page" id="page-browser">
      <div class="page-heading"><div class="eyebrow"><span class="eyebrow-dot"></span> BROWSER HANDOFF</div><h2>Open in browser</h2><p>Continue with your device's approved browser.</p></div>
      <div class="browser-hero"><div class="browser-globe">${icon("browser")}</div><b>Browse with freedom</b><small>Open a website using Chrome or your default browser.</small></div>
      <div class="download-card browser-card"><label for="browserUrl">WEBSITE LINK</label><div class="urlbox"><span class="url-icon">${icon("link")}</span><input id="browserUrl" type="url" placeholder="https://example.com" autocomplete="url"></div><button id="openBrowserBtn" class="primary">Open in browser <span class="button-arrow">↗</span></button><p class="status">Your organization's network rules still apply.</p></div>
    </section>

    <section class="page" id="page-settings">
      <div class="page-heading"><div class="eyebrow"><span class="eyebrow-dot"></span> MAKE IT YOURS</div><h2>Settings</h2><p>Manage the app appearance and learn about its engine.</p></div>
      <div class="download-card settings-list">
        <div class="setting-row"><span class="setting-icon purple">${icon("sun")}</span><div class="setting-copy"><b>Appearance</b><small>Switch dark / light theme</small></div><button id="settingsThemeBtn" class="setting-action">Toggle</button></div>
        <div class="setting-row"><span class="setting-icon cyan">${icon("speed")}</span><div class="setting-copy"><b>Download engine</b><small>yt-dlp · On-device processing</small></div><span class="setting-value">Native</span></div>
        <div class="setting-row"><span class="setting-icon green">${icon("shield")}</span><div class="setting-copy"><b>Privacy</b><small>No ad SDK or cloud download server</small></div><span class="setting-value good">Ad-free</span></div>
      </div>
      <div class="about-card"><div class="about-logo"><div class="brand-mark"><span></span></div></div><div><b>Nice Downloader</b><small>Simple. Private. Yours.</small></div><span class="about-version">APP</span></div>
    </section>
  </main>

  <nav class="bottom-nav" aria-label="Main sections">
    <button class="nav-item active" data-tab="home"><span>${icon("home")}</span><small>Home</small></button>
    <button class="nav-item" data-tab="downloads"><span>${icon("download")}</span><small>Downloads</small></button>
    <button class="nav-item" data-tab="browser"><span>${icon("browser")}</span><small>Browser</small></button>
    <button class="nav-item" data-tab="settings"><span>${icon("settings")}</span><small>Settings</small></button>
  </nav>
</div>`;

const $ = selector => document.querySelector(selector);
const input = $("#urlInput"), status = $("#status"), button = $("#downloadBtn");
const browserBtn = $("#browserBtn"), progressWrap = $("#progressWrap");
const progressBar = $("#progressBar"), progressValue = $("#progressValue"), progressLabel = $("#progressLabel");
const downloadState = $("#downloadState");
let progressListener = null;
let downloadSessions = 0;
let theme = "dark";

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
  theme = theme === "dark" ? "light" : "dark";
  document.body.classList.toggle("light", theme === "light");
  document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#f3f5fb" : "#090d18";
}
function validWebUrl(value) {
  try { const url = new URL(value.trim()); return ["http:", "https:"].includes(url.protocol) && url.hostname ? url : null; }
  catch { return null; }
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function updateDownloadSummary(label) {
  $("#downloadCount").textContent = String(downloadSessions);
  $("#downloadStatus").textContent = label;
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
    catch (error) { $(".browser-card .status").textContent = error?.message || "Could not open browser."; }
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
  button.innerHTML = '<span class="primary-icon">${icon("download")}</span> Starting…';
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressValue.textContent = "0%";
  progressLabel.textContent = "Connecting to source…";
  status.textContent = "Downloading on this device. Keep the app available.";
  downloadSessions += 1;
  updateDownloadSummary("Active");
  downloadState.innerHTML = '<div class="manager-status active-status"><span class="pulse-dot"></span> ACTIVE DOWNLOAD</div><div class="manager-file-icon">${icon("video")}</div><b>Download in progress</b><small>' + escapeText(url.hostname) + '</small><div class="manager-progress"><span id="managerProgressBar"></span></div><small id="managerProgressText">Connecting to source…</small>';
  try {
    if (!progressListener) {
      progressListener = await YtDlp.addListener("downloadProgress", event => {
        const pct = Math.max(0, Math.min(100, Number(event.progress) || 0));
        progressBar.style.width = pct + "%";
        progressValue.textContent = Math.round(pct) + "%";
        progressLabel.textContent = event.etaSeconds > 0 ? "Downloading · ETA " + event.etaSeconds + "s" : "Downloading…";
        const managerBar = $("#managerProgressBar"), managerText = $("#managerProgressText");
        if (managerBar) managerBar.style.width = pct + "%";
        if (managerText) managerText.textContent = Math.round(pct) + "% completed";
      });
    }
    const result = await YtDlp.download({url:url.href,quality:$("#quality").value});
    progressBar.style.width = "100%";
    progressValue.textContent = "100%";
    progressLabel.textContent = "Completed";
    status.textContent = "Download completed. Saved in the NiceDownloader app folder.";
    updateDownloadSummary("Completed");
    downloadState.innerHTML = '<div class="manager-status complete-status">${icon("check")} COMPLETED</div><div class="manager-file-icon complete-file">${icon("video")}</div><b>Download completed</b><small>' + escapeText(result.folder || "Saved in app Downloads") + '</small>';
  } catch (error) {
    const message = error?.message || String(error);
    status.textContent = "Download failed: " + message;
    progressLabel.textContent = "Download failed";
    updateDownloadSummary("Failed");
    downloadState.innerHTML = '<div class="manager-status failed-status">DOWNLOAD FAILED</div><div class="manager-file-icon failed-file">!</div><b>Could not complete download</b><small>' + escapeText(message) + '</small>';
    browserBtn.hidden = false;
  } finally {
    button.disabled = false;
    button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Download now <span class="button-arrow">→</span>';
  }
});
