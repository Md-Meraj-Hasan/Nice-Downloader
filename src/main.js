import "./style.css";

const app = document.querySelector("#app");
app.innerHTML = `
  <header class="top"><div class="brand"><div class="logo">N</div><div><b>Nice Downloader</b><small>Private • Fast • Ad-free</small></div></div><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">☼</button></header>
  <main>
    <section class="hero"><div class="eyebrow">YOUR DOWNLOAD SPACE</div><h1>Save what<br><span>matters.</span></h1><p>Paste a media link to check available download options.</p></section>
    <section class="panel">
      <label for="urlInput">VIDEO OR MEDIA LINK</label>
      <div class="urlbox"><input id="urlInput" type="url" placeholder="Paste a link here…" autocomplete="url"><button id="pasteBtn" class="paste">Paste</button></div>
      <button id="inspectBtn" class="primary"> <span>↓</span> Check link</button>
      <p class="hint" id="status" role="status">Only download content you own or are authorized to save.</p>
    </section>
    <section class="supported"><div class="section-title">POPULAR SOURCES</div><div class="sources"><span>▶ YouTube</span><span>f Facebook</span><span>◎ Instagram</span><span>♪ TikTok</span><span>𝕏 X</span><span>＋ More sites</span></div></section>
    <section class="panel options" id="options"><div class="section-title">DOWNLOAD OPTIONS</div><div class="empty"><div class="empty-icon">⇩</div><b>Nothing queued yet</b><small>Paste a supported link above to get started.</small></div></section>
    <section class="panel"><div class="section-title">RECENT DOWNLOADS</div><div class="empty compact"><small>Your download history will appear here.</small></div></section>
  </main>
  <footer>NO ADS · NO TRACKERS · NO ACCOUNT REQUIRED</footer>
`;

const input = document.querySelector("#urlInput");
const status = document.querySelector("#status");
document.querySelector("#pasteBtn").addEventListener("click", async () => {
  try { input.value = await navigator.clipboard.readText(); status.textContent = input.value ? "Link pasted. Tap Check link." : "Clipboard is empty."; }
  catch { status.textContent = "Clipboard access unavailable. Paste the link manually."; }
});
document.querySelector("#inspectBtn").addEventListener("click", () => {
  let url;
  try { url = new URL(input.value.trim()); } catch { status.textContent = "Please enter a valid http or https link."; return; }
  if (!["http:", "https:"].includes(url.protocol)) { status.textContent = "Only http and https links are accepted."; return; }
  status.textContent = "Link format looks valid. Media extraction and download support are being integrated; this preview does not download yet.";
});
document.querySelector("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  document.querySelector('meta[name="theme-color"]').content = document.body.classList.contains("light") ? "#f3f5fa" : "#090d18";
});
