package __PACKAGE__;

import android.net.Uri;
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

@CapacitorPlugin(name = "YtDlp")
public class YtDlpPlugin extends Plugin {
    private static boolean initialized = false;

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
                        .addOption("--no-warnings")
                        .addOption("--newline");
                Future<YtDlpResponse> future = YtDlp.executeAsync(request, (progress, eta, line) -> {
                    JSObject event = new JSObject();
                    event.put("progress", Math.max(0, Math.min(100, progress)));
                    event.put("etaSeconds", eta);
                    event.put("message", line == null ? "" : line);
                    notifyListeners("downloadProgress", event);
                });
                YtDlpResponse response = future.get();
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
