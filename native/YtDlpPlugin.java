package __PACKAGE__;

import android.net.Uri;
import android.content.ContentValues;
import android.os.Build;
import android.provider.MediaStore;
import android.webkit.MimeTypeMap;
import java.io.FileInputStream;
import java.io.OutputStream;
import android.content.Intent;
import java.io.InputStream;
import android.os.Environment;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import dev.ffmpegkit_maintained.ytdlp.YtDlp;
import dev.ffmpegkit_maintained.ytdlp.YtDlpException;
import dev.ffmpegkit_maintained.ytdlp.YtDlpRequest;
import dev.ffmpegkit_maintained.ytdlp.YtDlpResponse;
import java.io.File;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@CapacitorPlugin(name = "YtDlp")
public class YtDlpPlugin extends Plugin {
    private static boolean initialized = false;


    private File findNewestDownload(File folder, long startedAt) throws Exception {
        File[] files = folder.listFiles();
        if (files == null) throw new Exception("Download folder could not be read.");
        File newest = null;
        for (File file : files) {
            if (file.isFile() && !file.getName().endsWith(".part") &&
                !file.getName().endsWith(".ytdl") && !file.getName().endsWith(".temp") &&
                file.lastModified() >= startedAt - 2000 &&
                (newest == null || file.lastModified() > newest.lastModified())) {
                newest = file;
            }
        }
        if (newest == null || newest.length() == 0) throw new Exception("yt-dlp reported success, but the completed video file was not found.");
        return newest;
    }

    // Android 10+ MediaStore makes the file visible in the public Downloads collection.
    // On older Android versions retain the app-specific file and return its exact path.
    private String publishToPublicDownloads(File source) throws Exception {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return source.getAbsolutePath();
        String extension = "";
        int dot = source.getName().lastIndexOf('.');
        if (dot >= 0) extension = source.getName().substring(dot + 1).toLowerCase();
        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        if (mime == null) mime = "application/octet-stream";
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, source.getName());
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/NiceDownloader");
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri destination = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (destination == null) throw new Exception("Android could not create a file in public Downloads.");
        boolean copied = false;
        try (InputStream input = new FileInputStream(source);
             OutputStream output = getContext().getContentResolver().openOutputStream(destination, "w")) {
            if (output == null) throw new Exception("Android could not open the public Downloads file.");
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            output.flush();
            copied = true;
        } finally {
            if (copied) {
                ContentValues ready = new ContentValues();
                ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContext().getContentResolver().update(destination, ready, null, null);
            } else {
                getContext().getContentResolver().delete(destination, null, null);
            }
        }
        return Environment.DIRECTORY_DOWNLOADS + "/NiceDownloader/" + source.getName();
    }

    @PluginMethod
    public void getInfo(PluginCall call) {
        String rawUrl = call.getString("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) { call.reject("A media URL is required."); return; }
        Uri uri = Uri.parse(rawUrl.trim());
        if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null) {
            call.reject("Only valid HTTP or HTTPS links are supported."); return;
        }
        new Thread(() -> {
            try {
                synchronized (YtDlpPlugin.class) {
                    if (!initialized) { YtDlp.init(getContext()); initialized = true; }
                }
                YtDlpRequest request = new YtDlpRequest(rawUrl.trim())
                    .addOption("--dump-single-json")
                    .addOption("--skip-download")
                    .addOption("--no-warnings")
                    .addOption("--no-playlist")
                    .addOption("--socket-timeout", "45")
                    .addOption("--force-ipv4")
                    .addOption("--extractor-args", "youtube:player_client=android");
                Future<YtDlpResponse> infoFuture = YtDlp.executeAsync(request, (progress, eta, line) -> { });
                YtDlpResponse response = infoFuture.get(90, TimeUnit.SECONDS);
                if (response == null || !response.isSuccess()) {
                    String error = response == null ? "No response from media extractor." : response.getErrorOutput();
                    throw new Exception(error == null || error.isEmpty() ? "Could not read video details." : error);
                }
                org.json.JSONObject info = new org.json.JSONObject(response.getOutput());
                JSObject result = new JSObject();
                result.put("title", info.optString("title", "Media"));
                result.put("thumbnail", info.optString("thumbnail", ""));
                result.put("duration", info.optDouble("duration", 0));
                result.put("uploader", info.optString("uploader", info.optString("channel", "")));
                org.json.JSONArray formats = info.optJSONArray("formats");
                org.json.JSONArray choices = new org.json.JSONArray();
                java.util.HashSet<String> seen = new java.util.HashSet<>();
                if (formats != null) {
                    for (int i = 0; i < formats.length(); i++) {
                        org.json.JSONObject item = formats.optJSONObject(i);
                        if (item == null) continue;
                        String id = item.optString("format_id", "");
                        String vcodec = item.optString("vcodec", "none");
                        String acodec = item.optString("acodec", "none");
                        boolean hasVideo = !id.isEmpty() && !"none".equals(vcodec);
                        boolean hasAudio = !"none".equals(acodec);
                        if (!hasVideo) continue;
                        int height = item.optInt("height", 0);
                        if (height <= 0) continue;
                        String ext = item.optString("ext", "");
                        String key = height + ":" + hasAudio + ":" + ext + ":" +
                            item.optString("vcodec", "") + ":" + item.optString("format_note", "");
                        if (seen.contains(key)) continue;
                        seen.add(key);
                        JSObject choice = new JSObject();
                        choice.put("formatId", id);
                        choice.put("height", height);
                        choice.put("ext", ext);
                        choice.put("hasAudio", hasAudio);
                        choice.put("vcodec", item.optString("vcodec", ""));
                        choice.put("fps", item.optDouble("fps", 0));
                        choice.put("formatNote", item.optString("format_note", ""));
                        choice.put("filesize", item.optLong("filesize", item.optLong("filesize_approx", 0)));
                        choices.put(choice);
                    }
                }
                result.put("formats", choices);
                result.put("audioAvailable", true);
                call.resolve(result);
            } catch (Exception e) { call.reject("Could not fetch media details: " + e.getMessage()); }
        }, "NiceDownloader-media-info").start();
    }

    @PluginMethod
    public void download(PluginCall call) {
        String rawUrl = call.getString("url");
        String quality = call.getString("quality", "best");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            call.reject("A media URL is required.");
            return;
        }
        Uri uri = Uri.parse(rawUrl.trim());
        if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null) {
            call.reject("Only valid HTTP or HTTPS links are supported.");
            return;
        }
        String format;
        if (quality.startsWith("format:")) {
            String requestedId = quality.substring(7);
            if (!requestedId.matches("[A-Za-z0-9._+-]+")) { call.reject("Invalid format selection."); return; }
            // Select the requested video stream and let yt-dlp pair it with the best
            // compatible audio stream. Audio is never appended to an audio-only choice.
            format = requestedId + "+bestaudio/best";
        } else if (quality.startsWith("height:")) {
            String requestedHeight = quality.substring(7);
            if (!requestedHeight.matches("[0-9]{2,4}")) { call.reject("Invalid resolution selection."); return; }
            format = "bestvideo[height=" + requestedHeight + "]+bestaudio/best[height=" + requestedHeight + "]/best[height=" + requestedHeight + "]";
        } else if ("audio".equals(quality)) {
            format = "bestaudio/best";
        } else {
            format = "bestvideo+bestaudio/best";
        }

        Intent foregroundIntent = new Intent(getContext(), DownloadForegroundService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            getContext().startForegroundService(foregroundIntent);
        } else {
            getContext().startService(foregroundIntent);
        }
        new Thread(() -> {
            try {
                synchronized (YtDlpPlugin.class) {
                    if (!initialized) {
                        YtDlp.init(getContext());
                        initialized = true;
                    }
                }
                File base = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (base == null) base = getContext().getFilesDir();
                File folder = new File(base, "NiceDownloader");
                if (!folder.exists() && !folder.mkdirs()) throw new Exception("Could not create download folder");
                String template = new File(folder, "%(title).120B [%(id)s].%(ext)s").getAbsolutePath();
                YtDlpRequest request = new YtDlpRequest(rawUrl.trim())
                        .setOutputTemplate(template)
                        .addOption("-f", format)
                        .addOption("--no-playlist")
                        // Parallel HLS/DASH fragment fetching; this does not override server or network limits.
                        .addOption("--concurrent-fragments", "8")
                        .addOption("--retries", "10")
                        .addOption("--fragment-retries", "10")
                        .addOption("--file-access-retries", "5")
                        .addOption("--socket-timeout", "60")
                        // Prefer IPv4 on networks where IPv6 routing or TLS paths are unstable.
                        .addOption("--force-ipv4")
                        .addOption("--extractor-retries", "5")
                        .addOption("--buffer-size", "16K")
                        // Prefer YouTube's Android player client on Android devices. This is a free
                        // compatibility fallback; it does not disable TLS certificate checks.
                        .addOption("--extractor-args", "youtube:player_client=android")
                        .addOption("--newline");
                JSObject connecting = new JSObject();
                connecting.put("progress", 0);
                connecting.put("etaSeconds", 0);
                connecting.put("message", "Connecting to source and reading media information…");
                notifyListeners("downloadProgress", connecting);
                long downloadStartedAt = System.currentTimeMillis();
                Future<YtDlpResponse> future = YtDlp.executeAsync(request, (progress, eta, line) -> {
                    JSObject event = new JSObject();
                    event.put("progress", Math.max(0, Math.min(100, progress)));
                    event.put("etaSeconds", eta);
                    event.put("message", line == null ? "" : line);
                    notifyListeners("downloadProgress", event);
                });
                YtDlpResponse response;
                try {
                    // Avoid leaving the UI waiting forever if the source/network never responds.
                    response = future.get(150, TimeUnit.SECONDS);
                } catch (TimeoutException timeout) {
                    future.cancel(true);
                    call.reject("Connection timed out after 150 seconds. Check your internet or office Wi-Fi restrictions, then try again.");
                    return;
                }
                if (response != null && response.isSuccess()) {
                    File downloadedFile = findNewestDownload(folder, downloadStartedAt);
                    String publicPath = publishToPublicDownloads(downloadedFile);
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("output", response.getOutput());
                    result.put("folder", folder.getAbsolutePath());
                    result.put("fileName", downloadedFile.getName());
                    result.put("filePath", publicPath);
                    result.put("publicDownload", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q);
                    call.resolve(result);
                } else {
                    String detail = response == null ? "No response from yt-dlp" : response.getErrorOutput();
                    call.reject(detail == null || detail.isEmpty() ? "Download failed. The source may not permit downloading or may require authorization." : detail);
                }
            } catch (YtDlpException e) {
                call.reject("Downloader initialization failed: " + e.getMessage());
            } catch (Exception e) {
                call.reject("Download failed: " + e.getMessage());
            } finally {
                try { getContext().stopService(foregroundIntent); } catch (Exception ignored) { }
            }
        }, "NiceDownloader-yt-dlp").start();
    }
}
