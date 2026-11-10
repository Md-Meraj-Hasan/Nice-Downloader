import "./style.css";
import { registerPlugin, Capacitor } from "@capacitor/core";
import { Innertube, Platform } from "youtubei.js/web";

Platform.shim.eval = async (data) => new Function(data.output)();
let youtubeClientPromise;

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
    folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7z"/>',
  };
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.download)+'</svg>';
};

app.innerHTML = `
<div class="app-shell">
  <header class="topbar">
    <div class="brand"><div class="brand-mark"><span></span></div><div class="brand-copy"><b>Nice Downloader</b><small>VIDEO DOWNLOADER</small></div></div>
  </header>


  <main class="stage">
    <section class="page active" id="page-home">
      <div class="hero-banner">
        <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-dot"></span> YOUTUBE VIDEO DOWNLOADER</div><h1>Your media.<br><span>Your way.</span></h1><p>Download supported videos in your preferred quality</p></div>
        <div class="hero-art"><div class="hero-ring"></div><div class="hero-download">${icon("download")}</div><div class="hero-play">▶</div></div>
        <div class="hero-glow"></div>
      </div>

      <div class="section-heading"><div><span class="section-kicker">GET STARTED</span><h2>New download</h2></div><span class="secure-chip">${icon("shield")} On-device</span></div>
      <div class="download-card">
        <label for="urlInput">PASTE YOUR MEDIA LINK</label>
        <div class="urlbox"><span class="url-icon">${icon("link")}</span><input id="urlInput" type="url" placeholder="Paste YouTube video link here…" autocomplete="url"><button id="pasteBtn" class="paste-btn" aria-label="Paste from clipboard">${icon("paste")}</button></div>
        <select id="quality" hidden><option value="best">Best</option><option value="audio">Audio</option></select>
        
        <button id="downloadBtn" class="primary"><span class="primary-icon">${icon("download")}</span> Load video details <span class="button-arrow">→</span></button>
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

    <section class="page settings-page" id="page-settings">
      <div class="page-heading"><div class="eyebrow"><span class="eyebrow-dot"></span> APP PREFERENCES</div><h2>Settings</h2><p>Manage where your downloads are saved and check storage access.</p></div>
      <div class="settings-card">
        <div class="settings-title"><span class="settings-icon">${icon("folder")}</span><div><b>Storage setup</b><small>Download folder and permission</small></div><span id="storageBadge" class="settings-badge">Checking…</span></div>
        <div class="storage-location"><small>SAVE LOCATION</small><b id="storageLocation">Download/NiceDownloader</b><p id="storageMethod">Checking Android storage configuration…</p></div>
        <div class="storage-actions">
          <button type="button" class="primary settings-action" id="storageSetupBtn">Set up storage access</button>
          <button type="button" class="settings-secondary" id="openAppSettingsBtn">App permission settings</button>
        </div>
        <p class="settings-help" id="storageHelp">Android 10 and newer use the system Downloads provider. Older Android versions may ask for storage permission.</p>
      </div>
      <div class="settings-card settings-info">
        <div class="settings-title"><span class="settings-icon">${icon("shield")}</span><div><b>Privacy & access</b><small>No all-files access required</small></div></div>
        <p>Nice Downloader saves files in its Download/NiceDownloader folder. It does not need access to all files on your device.</p>
      </div>
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
    <button class="nav-item" data-tab="settings"><span>${icon("settings")}</span><small>Settings</small></button>
  </nav>
</div>`;

const $ = selector => document.querySelector(selector);
const input = $("#urlInput"), status = $("#status"), button = $("#downloadBtn");
const progressWrap = $("#progressWrap");
const progressBar = $("#progressBar"), progressValue = $("#progressValue"), progressLabel = $("#progressLabel");
const downloadState = $("#downloadState");
let progressListener = null;
let downloadSessions = 0;
let activeVideoTitle = "YouTube video";
let activeFormat = null;

function extractYouTubeVideoId(value) {
  const url = validWebUrl(value);
  if (!url) return "";
  const host = url.hostname.toLowerCase().replace(/^www\\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
  if (url.pathname === "/watch") return url.searchParams.get("v") || "";
  const parts = url.pathname.split("/").filter(Boolean);
  return ["shorts", "embed", "live"].includes(parts[0]) ? (parts[1] || "") : "";
}

async function readYouTubeDetails(videoUrl) {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) throw new Error("Unsupported YouTube video link.");
  try {
    youtubeClientPromise ||= Innertube.create({
      client_type: "WEB",
      retrieve_player: true,
      enable_session_cache: true
    });
    const youtube = await youtubeClientPromise;
    const info = await youtube.getBasicInfo(videoId);
    const rawFormats = info.streaming_data?.formats || [];
    const formats = [];
    let decipherFailures = 0;
    for (const format of rawFormats) {
      if (!format.has_video || !format.has_audio || !String(format.mime_type || "").toLowerCase().includes("video/mp4")) continue;
      let streamUrl = "";
      try { streamUrl = format.url || await format.decipher(youtube.session.player); } catch { decipherFailures += 1; continue; }
      if (!streamUrl || !streamUrl.startsWith("https://")) continue;
      formats.push({
        url: streamUrl,
        height: Number(format.height) || 0,
        ext: "mp4",
        filesize: Number(format.content_length) || 0,
        hasVideo: true,
        hasAudio: true,
        mimeType: "video/mp4",
        quality: format.quality_label || (format.height ? format.height + "p" : "MP4")
      });
    }
    formats.sort((a, b) => b.height - a.height);
    const basic = info.basic_info || {};
    const thumbnails = basic.thumbnail || [];
    return {
      videoId,
      title: basic.title || "YouTube video",
      uploader: basic.author || "",
      thumbnail: thumbnails.length ? thumbnails[thumbnails.length - 1].url : "",
      duration: Number(basic.duration) || 0,
      formats,
      decipherFailures,
      downloadable: formats.length > 0
    };
  } catch (error) {
    throw new Error("YouTube stream extraction failed: " + (error?.message || "network or video unavailable"));
  }
}

function switchTab(tab) {
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === "page-" + tab));
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item.dataset.tab === tab));
}
function validWebUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isYouTube = host === "youtube.com" || host.endsWith(".youtube.com") ||
      host === "youtu.be" || host.endsWith(".youtu.be");
    return ["http:", "https:"].includes(url.protocol) && isYouTube ? url : null;
  } catch { return null; }
}
function escapeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function updateDownloadSummary(label) {
  $("#downloadCount").textContent = String(downloadSessions);
  $("#downloadStatus").textContent = label;
}

document.querySelectorAll("[data-tab]").forEach(item => item.addEventListener("click", () => switchTab(item.dataset.tab)));

async function refreshStorageSettings() {
  const badge = $("#storageBadge");
  const location = $("#storageLocation");
  const method = $("#storageMethod");
  const action = $("#storageSetupBtn");
  if (!Capacitor.isNativePlatform()) {
    badge.textContent = "Android only";
    location.textContent = "Download/NiceDownloader";
    method.textContent = "Install the Android app to configure device storage.";
    action.disabled = true;
    return;
  }
  try {
    const state = await YtDlp.getStorageStatus();
    location.textContent = state.saveLocation || "Download/NiceDownloader";
    method.textContent = state.method || "Android storage provider";
    badge.textContent = state.storageReady ? "Ready" : "Permission needed";
    badge.classList.toggle("ready", Boolean(state.storageReady));
    action.textContent = state.storageReady ? "Storage is ready" : "Grant storage permission";
    action.disabled = Boolean(state.storageReady);
    $("#storageHelp").textContent = state.legacyPermissionRequired
      ? "Android 9 and below require storage permission to write into the public Downloads folder."
      : "No storage permission is required on this Android version. Files are saved using Android MediaStore.";
  } catch (error) {
    badge.textContent = "Unavailable";
    method.textContent = error?.message || "Could not read storage status.";
    action.disabled = false;
  }
}
$("#storageSetupBtn").addEventListener("click", async () => {
  const action = $("#storageSetupBtn");
  action.disabled = true;
  action.textContent = "Checking permission…";
  try {
    const result = await YtDlp.requestStoragePermission();
    $("#storageHelp").textContent = result.message || (result.storageReady ? "Storage is ready." : "Permission was not granted.");
  } catch (error) {
    $("#storageHelp").textContent = error?.message || "Could not request storage permission.";
  } finally {
    await refreshStorageSettings();
  }
});
$("#openAppSettingsBtn").addEventListener("click", async () => {
  try { await YtDlp.openAppSettings(); }
  catch (error) { $("#storageHelp").textContent = error?.message || "Could not open Android app settings."; }
});
document.querySelector('[data-tab="settings"]').addEventListener("click", refreshStorageSettings);


let formatLookupInProgress = false;
let loadedFormatsForUrl = "";

async function previewYouTubeLink(value) {
  const url = validWebUrl(value);
  if (!url) {
    status.textContent = "Please paste a valid YouTube video link.";
    return;
  }
  if (!Capacitor.isNativePlatform()) {
    status.textContent = "Video preview and format selection are available in the Android APK.";
    return;
  }
  if (formatLookupInProgress) return;
  if (loadedFormatsForUrl === url.href) {
    $("#formatModal").hidden = false;
    return;
  }
  formatLookupInProgress = true;
  status.textContent = "Loading YouTube video details…";
  button.disabled = true;
  button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Loading video…';
  try {
    const info = await readYouTubeDetails(url.href);
    showFormatChoices(info);
    loadedFormatsForUrl = url.href;
    status.textContent = info.formats?.length ? "Video details and MP4 qualities loaded." : "Video details loaded, but no compatible MP4 stream is available.";
  } catch (error) {
    loadedFormatsForUrl = "";
    activeFormat = null;
    status.textContent = "Could not load video details: " + (error?.message || error);
  } finally {
    formatLookupInProgress = false;
    button.disabled = false;
    button.innerHTML = '<span class="primary-icon">' + icon("download") + '</span> Download now';
  }
}

$("#pasteBtn").addEventListener("click", async () => {
  try {
    input.value = (await navigator.clipboard.readText()).trim();
    if (!input.value) { status.textContent = "Clipboard is empty."; return; }
    await previewYouTubeLink(input.value);
  } catch {
    status.textContent = "Clipboard unavailable. Paste your link manually.";
  }
});

// Automatically preview when a link is pasted into the URL field.
input.addEventListener("paste", () => {
  window.setTimeout(() => {
    input.value = input.value.trim();
    if (input.value) previewYouTubeLink(input.value);
  }, 0);
});

async function startSelectedDownload() {
  const url = validWebUrl(input.value);
  if (!url) { status.textContent = "Please enter a valid YouTube video link."; input.focus(); return; }
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
    if (!activeFormat?.url) throw new Error("Please select a supported YouTube format first.");
    const result = await YtDlp.downloadStream({streamUrl:activeFormat.url,title:activeVideoTitle,extension:activeFormat.ext,mimeType:activeFormat.mimeType});
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
  activeVideoTitle = info.title || "YouTube video";
  $("#formatTitle").textContent = activeVideoTitle;
  const duration = Number(info.duration) || 0;
  $("#formatSubtitle").textContent = (info.uploader ? info.uploader + " · " : "") +
    (duration ? Math.floor(duration / 60) + ":" + String(Math.floor(duration % 60)).padStart(2, "0") : "YouTube video");
  const thumb = $("#formatThumbnail");
  if (info.thumbnail && info.thumbnail.startsWith("https://")) {
    thumb.src = info.thumbnail; thumb.hidden = false; $("#formatThumbnailFallback").hidden = true;
    thumb.onerror = () => { thumb.hidden = true; $("#formatThumbnailFallback").hidden = false; };
  } else { thumb.hidden = true; $("#formatThumbnailFallback").hidden = false; }
  const list = $("#formatOptions");
  list.innerHTML = "";
  const videos = (Array.isArray(info.formats) ? info.formats : [])
    .filter(f => f.hasVideo && f.hasAudio && f.url && f.mimeType === "video/mp4")
    .sort((a, b) => b.height - a.height);
  videos.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "format-choice";
    const radio = document.createElement("input");
    radio.type = "radio"; radio.name = "mediaFormat"; radio.value = "video:" + index; radio.checked = index === 0;
    const detail = document.createElement("span");
    const size = formatSize(item.filesize);
    detail.innerHTML = "<b>" + (item.quality || (item.height + "p")) + "</b><small>MP4 · " + (size || "size varies") + " · video + audio</small>";
    label.append(radio, detail);
    list.append(label);
    radio.addEventListener("change", () => { activeFormat = item; selectedFormat = radio.value; });
  });
  activeFormat = videos[0] || null;
  selectedFormat = videos.length ? "video:0" : "";
  if (!videos.length) {
    const notice = document.createElement("div");
    notice.className = "format-unavailable";
    notice.textContent = "No compatible combined MP4 stream was returned for this video. Try another public video or network.";
    list.append(notice);
  }
  $("#formatStart").disabled = videos.length === 0;
  $("#formatStart").textContent = videos.length ? "Download MP4 video" : "No MP4 stream available";
  $("#formatModal").hidden = false;
}
button.addEventListener("click", async () => {
  const url = validWebUrl(input.value);
  if (!url) { status.textContent = "Please enter a valid YouTube video link."; input.focus(); return; }
  await previewYouTubeLink(url.href);
});
$("#formatStart").addEventListener("click", async () => {
  $("#quality").value = selectedFormat; closeFormatModal(); await startSelectedDownload();
});
