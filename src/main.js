import "./style.css";
import { registerPlugin, Capacitor } from "@capacitor/core";

const YtDlp = registerPlugin("YtDlp");
const app = document.querySelector("#app");

const icon = (name) => {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 19v2h16v-2"/>',
    paste:'<rect x="8" y="3" width="12" height="15" rx="2"/><path d="M5 7H4a1 1 0 0 0-1 1v13h12a1 1 0 0 0 1-1v-1"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/>',
    video:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3z"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    playlist:'<path d="M4 6h16M4 12h10M4 18h7"/><path d="m17 15 4 3-4 3z"/>',
    speed:'<path d="M3 17a9 9 0 1 1 18 0"/><path d="m12 13 4-4M6 17h12"/>',
    shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.download)+'</svg>';
};

app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <div class="brand"><div class="brand-mark"><span></span></div><div class="brand-copy"><b>Nice Downloader</b><small>VIDEO · AUDIO DOWNLOADER</small></div></div>
  </header>


  <main class="stage">
    <section class="page active" id="page-home">
      <div class="hero-banner">
        <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-dot"></span> ALL MEDIA DOWNLOADER</div><h1>Your media.<br><span>Your way.</span></h1><p>Download videos and audio in your preferred quality</p></div>
        <div class="hero-art"><div class="hero-ring"></div><div class="hero-download">${icon("download")}</div><div class="hero-play">▶</div></div>
        <div class="hero-glow"></div>
      </div>

      <div class="section-heading"><div><span class="section-kicker">GET STARTED</span><h2>New download</h2></div><span class="secure-chip">${icon("shield")} On-device</span></div>
      <div class="download-card">
        <label for="urlInput">PASTE YOUR MEDIA LINK</label>
        <div class="urlbox"><span class="url-icon">${icon("link")}</span><input id="urlInput" type="url" placeholder="Paste video or audio link here…" autocomplete="url"><button id="pasteBtn" class="paste-btn" aria-label="Paste from clipboard">${icon("paste")}</button></div>
        <select id="quality" hidden><option value="best">Best</option><option value="audio">Audio</option></select>
        <button id="downloadBtn" class="primary"><span class="primary-icon">${icon("download")}</span> Download now <span class="button-arrow">→</span></button>
        <p class="status" id="status" role="status">Only download content you own or are allowed to save.</p>
        <div class="progress-wrap" id="progressWrap" hidden><div class="progress-head"><span id="progressLabel">Connecting…</span><b id="progressValue">0%</b></div><div class="progress-track"><div id="progressBar"></div></div></div>
      </div>
    </section>

    <section class="page" id="page-downloads">
      <div class="page-heading"><div class="eyebrow"><span class="eyebrow-dot"></span> YOUR LIBRARY</div><h2>Downloads</h2><p>Track the current download and latest result.</p></div>
      <div class="download-stats"><div><span class="stat-icon purple">${icon("download")}</span><b id="downloadCount">0</b><small>Sessions</small></div><div><span class="stat-icon cyan">${icon("speed")}</span><b id="downloadStatus">Ready</b><small>Latest status</small></div></div>
      <div class="download-card manager-card" id="downloadState"><div class="empty-illustration">${icon("download")}</div><b>No downloads yet</b><small>Your download activity will appear here.</small></div>
      <p class="storage-note">${icon("shield")} On Android 10+, completed files appear in Internal Storage / Download / NiceDownloader.</p>
    </section>

  </main>

  <div class="format-modal-backdrop" id="formatModal" hidden>
    <section class="format-modal" role="dialog" aria-modal="true" aria-labelledby="formatTitle">
      <button type="button" class="format-close" id="formatClose" aria-label="Close">×</button>
      <div class="format-preview"><img id="formatThumbnail" alt="Video thumbnail" hidden><div id="formatThumbnailFallback">▶</div></div>
      <div class="format-meta"><h2 id="formatTitle">Choose download format</h2><p id="formatSubtitle">Loading video details…</p></div>
      <div class="format-options" id="formatOptions"></div>
      <button type="button" class="primary format-start" id="formatStart" disabled>Download selected format</button>
      <p class="format-note">Only download content you own or are allowed to save.</p>
    </section>
  </div>
  <nav class="bottom-nav" aria-label="Download sections">
    <button class="nav-item active" data-tab="home"><span>${icon("download")}</span><small>Download</small></button>
    <button class="nav-item" data-tab="downloads"><span>${icon("video")}</span><small>Downloads</small></button>
  </nav>
</div>`;

const $ = selector => document.querySelector(selector);
const input = $("#urlInput"), status = $("#status"), button = $("#downloadBtn");
const progressWrap = $("#progressWrap");
const progressBar = $("#progressBar"), progressValue = $("#progressValue"), progressLabel = $("#progressLabel");
const downloadState = $("#downloadState");
let progressListener = null;
let downloadSessions = 0;

function switchTab(tab) {
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === "page-" + tab));
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item.dataset.tab === tab));
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

document.querySelectorAll("[data-tab]").forEach(item => item.addEventListener("click", () => switchTab(item.dataset.tab)));


$("#pasteBtn").addEventListener("click", async () => {
  try { input.value = await navigator.clipboard.readText(); status.textContent = input.value ? "Link pasted. Ready to download." : "Clipboard is empty."; }
  catch { status.textContent = "Clipboard unavailable. Paste your link manually."; }
});

async function startSelectedDownload() {
  const url = validWebUrl(input.value);
  if (!url) { status.textContent = "Please enter a valid http or https link."; input.focus(); return; }
  if (!Capacitor.isNativePlatform()) { status.textContent = "Native downloading is available in the Android APK."; return; }
  button.disabled = true;
  button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Starting…';
  progressWrap.hidden = false;
  progressBar.style.width = "0%";
  progressValue.textContent = "0%";
  progressLabel.textContent = "Preparing downloader…";
  status.textContent = "Preparing connection. If the source does not respond, the app will show a timeout.";
  downloadSessions += 1;
  updateDownloadSummary("Active");
  downloadState.innerHTML = '<div class="manager-status active-status"><span class="pulse-dot"></span> ACTIVE DOWNLOAD</div><div class="manager-file-icon">${icon("video")}</div><b>Download in progress</b><small>' + escapeText(url.hostname) + '</small><div class="manager-progress"><span id="managerProgressBar"></span></div><small id="managerProgressText">Connecting to source…</small>';
  try {
    if (!progressListener) {
      progressListener = await YtDlp.addListener("downloadProgress", event => {
        const pct = Math.max(0, Math.min(100, Number(event.progress) || 0));
        progressBar.style.width = pct + "%";
        progressValue.textContent = Math.round(pct) + "%";
        progressLabel.textContent = event.progress > 0 ? (event.etaSeconds > 0 ? "Downloading · ETA " + event.etaSeconds + "s" : "Downloading…") : (event.message || "Connecting to source…");
        const managerBar = $("#managerProgressBar"), managerText = $("#managerProgressText");
        if (managerBar) managerBar.style.width = pct + "%";
        if (managerText) managerText.textContent = Math.round(pct) + "% completed";
      });
    }
    const result = await YtDlp.download({url:url.href,quality:$("#quality").value});
    progressBar.style.width = "100%";
    progressValue.textContent = "100%";
    progressLabel.textContent = "Completed";
    status.textContent = result.publicDownload ? "✓ Saved to Internal Storage / Download / NiceDownloader: " + (result.fileName || "video") : "✓ Download completed. App-private file: " + (result.filePath || result.folder || "open app storage");
    updateDownloadSummary("Completed");
    downloadState.innerHTML = '<div class="manager-status complete-status">${icon("check")} COMPLETED</div><div class="manager-file-icon complete-file">${icon("video")}</div><b>Download completed</b><small>' + escapeText(result.folder || "Saved in app Downloads") + '</small>';
  } catch (error) {
    const message = error?.message || String(error);
    status.textContent = "Download failed: " + message;
    progressLabel.textContent = message.toLowerCase().includes("timed out") ? "Connection timed out" : "Download failed";
    updateDownloadSummary("Failed");
    downloadState.innerHTML = '<div class="manager-status failed-status">DOWNLOAD FAILED</div><div class="manager-file-icon failed-file">!</div><b>Could not complete download</b><small>' + escapeText(message) + '</small>';
  } finally {
    button.disabled = false;
    button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Download now';
  }}

let selectedFormat = "best";
function closeFormatModal() { $("#formatModal").hidden = true; }
$("#formatClose").addEventListener("click", closeFormatModal);
$("#formatModal").addEventListener("click", event => { if (event.target.id === "formatModal") closeFormatModal(); });
function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / 1048576;
  return mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : mb.toFixed(1) + " MB";
}
function showFormatChoices(info) {
  $("#formatTitle").textContent = info.title || "Choose download format";
  const duration = Number(info.duration) || 0;
  $("#formatSubtitle").textContent = (info.uploader ? info.uploader + " · " : "") +
    (duration ? Math.floor(duration / 60) + ":" + String(Math.floor(duration % 60)).padStart(2, "0") : "Available formats");
  const thumb = $("#formatThumbnail");
  if (info.thumbnail && /^https?:\/\//i.test(info.thumbnail)) {
    thumb.src = info.thumbnail; thumb.hidden = false; $("#formatThumbnailFallback").hidden = true;
    thumb.onerror = () => { thumb.hidden = true; $("#formatThumbnailFallback").hidden = false; };
  } else { thumb.hidden = true; $("#formatThumbnailFallback").hidden = false; }
  const list = $("#formatOptions"); list.innerHTML = "";
  const formats = Array.isArray(info.formats) ? info.formats : [];
  const byHeight = new Map();
  formats.forEach(format => {
    const height = Number(format.height) || 0;
    if (!height || !format.formatId) return;
    const current = byHeight.get(height);
    // Prefer a combined audio+video format when available; otherwise let yt-dlp
    // merge this video-only stream with the best compatible audio stream.
    if (!current || (format.hasAudio && !current.hasAudio) ||
        (format.hasAudio === current.hasAudio && Number(format.filesize) > Number(current.filesize))) {
      byHeight.set(height, format);
    }
  });
  const heights = [...byHeight.keys()].sort((a,b) => b-a);
  heights.forEach((height, index) => {
    const item = byHeight.get(height);
    const label = document.createElement("label"); label.className = "format-choice";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "mediaFormat";
    radio.value = "height:" + height; radio.checked = index === 0;
    const detail = document.createElement("span");
    const size = formatSize(item.filesize);
    const fps = item.fps ? " · " + Math.round(item.fps) + " FPS" : "";
    const audioText = item.hasAudio ? "Audio included" : "Audio merged automatically";
    detail.innerHTML = "<b>" + height + "p</b><small>" + String(item.ext || "video").toUpperCase() +
      fps + " · " + audioText + (size ? " · " + size : "") + "</small>";
    label.append(radio, detail); list.append(label);
  });
  const audio = document.createElement("label"); audio.className = "format-choice audio-choice";
  const ar = document.createElement("input"); ar.type = "radio"; ar.name = "mediaFormat"; ar.value = "audio"; ar.checked = heights.length === 0;
  const ad = document.createElement("span"); ad.innerHTML = "<b>Only Audio</b><small>Best available audio stream</small>";
  audio.append(ar, ad); list.append(audio);
  selectedFormat = list.querySelector('input[name="mediaFormat"]:checked')?.value || "audio";
  list.querySelectorAll('input[name="mediaFormat"]').forEach(r => r.addEventListener("change", () => selectedFormat = r.value));
  $("#formatStart").disabled = false; $("#formatModal").hidden = false;
}
button.addEventListener("click", async () => {
  const url = validWebUrl(input.value);
  if (!url) { status.textContent = "Please enter a valid http or https link."; input.focus(); return; }
  if (!Capacitor.isNativePlatform()) { status.textContent = "Format selection is available in the Android APK."; return; }
  button.disabled = true; button.textContent = "Reading video details…";
  status.textContent = "Reading all available video resolutions and audio formats…";
  try { showFormatChoices(await YtDlp.getInfo({url:url.href})); status.textContent = "Choose video quality or audio-only format."; }
  catch (error) { status.textContent = "Could not read media formats: " + (error?.message || error); }
  finally { button.disabled = false; button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Download now'; }
});
$("#formatStart").addEventListener("click", async () => {
  $("#quality").value = selectedFormat; closeFormatModal(); await startSelectedDownload();
});
