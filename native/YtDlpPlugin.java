package __PACKAGE__;

import android.net.Uri;
import android.content.Intent;
import android.app.Activity;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
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


    @PluginMethod
    public void openInBrowser(PluginCall call) {
        String rawUrl = call.getString("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            call.reject("A web link is required.");
            return;
        }
        Uri uri = Uri.parse(rawUrl.trim());
        if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null) {
            call.reject("Only valid HTTP or HTTPS links are supported.");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open the link in a browser: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pickCookies(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {"text/plain", "text/*", "application/octet-stream"});
        startActivityForResult(call, intent, "cookiesFilePicked");
    }

    @ActivityCallback
    private void cookiesFilePicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("No cookies file selected."); return;
        }
        try (InputStream input = getContext().getContentResolver().openInputStream(result.getData().getData());
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new Exception("Cannot read selected file.");
            byte[] buffer = new byte[8192]; int read; int total = 0;
            while ((read = input.read(buffer)) != -1) {
                total += read; if (total > 2 * 1024 * 1024) throw new Exception("Cookies file exceeds 2 MB.");
                output.write(buffer, 0, read);
            }
            String source = new String(output.toByteArray(), StandardCharsets.UTF_8);
            StringBuilder filtered = new StringBuilder("# Netscape HTTP Cookie File\n");
            int kept = 0;
            for (String line : source.split("\\r?\\n")) {
                if (line.trim().isEmpty() || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) continue;
                String[] fields = line.split("\\t");
                if (fields.length >= 7) {
                    String domain = fields[0].trim().toLowerCase().replace("#httponly_", "");
                    if (domain.equals("youtube.com") || domain.endsWith(".youtube.com")) { filtered.append(line).append('\n'); kept++; }
                }
            }
            if (kept == 0) throw new Exception("No YouTube cookies found. Choose a Netscape-format cookies.txt file.");
            File cookieFile = new File(getContext().getFilesDir(), "youtube-cookies.txt");
            try (FileOutputStream fileOut = new FileOutputStream(cookieFile, false)) { fileOut.write(filtered.toString().getBytes(StandardCharsets.UTF_8)); }
            JSObject response = new JSObject(); response.put("imported", true); response.put("cookies", kept); call.resolve(response);
        } catch (Exception e) { call.reject("Could not import cookies: " + e.getMessage()); }
    }

    @PluginMethod
    public void clearCookies(PluginCall call) {
        File cookieFile = new File(getContext().getFilesDir(), "youtube-cookies.txt");
        if (!cookieFile.exists() || cookieFile.delete()) call.resolve();
        else call.reject("Could not remove saved cookies file.");
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
        switch (quality) {
            case "1080": format = "best[height<=1080]"; break;
            case "720": format = "best[height<=720]"; break;
            case "480": format = "best[height<=480]"; break;
            case "audio": format = "bestaudio/best"; break;
            default: format = "best";
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
                        .addOption("--no-warnings")
                        .addOption("--newline");
                File cookieFile = new File(getContext().getFilesDir(), "youtube-cookies.txt");
                if (cookieFile.isFile() && cookieFile.length() > 0) request.addOption("--cookies", cookieFile.getAbsolutePath());
                JSObject connecting = new JSObject();
                connecting.put("progress", 0);
                connecting.put("etaSeconds", 0);
                connecting.put("message", "Connecting to source and reading media information…");
                notifyListeners("downloadProgress", connecting);
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
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("output", response.getOutput());
                    result.put("folder", folder.getAbsolutePath());
                    call.resolve(result);
                } else {
                    String detail = response == null ? "No response from yt-dlp" : response.getErrorOutput();
                    call.reject(detail == null || detail.isEmpty() ? "Download failed. The source may not permit downloading or may require authorization." : detail);
                }
            } catch (YtDlpException e) {
                call.reject("Downloader initialization failed: " + e.getMessage());
            } catch (Exception e) {
                call.reject("Download failed: " + e.getMessage());
            }
        }, "NiceDownloader-yt-dlp").start();
    }
}
