package __PACKAGE__

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.concurrent.thread

@CapacitorPlugin(name = "YtDlp")
class YouTubeDownloadPlugin : Plugin() {
    @PluginMethod
    fun downloadStream(call: PluginCall) {
        val raw = call.getString("streamUrl")?.trim().orEmpty()
        val title = call.getString("title")?.trim().orEmpty().ifBlank { "YouTube video" }
        val extension = call.getString("extension")?.lowercase(Locale.ROOT)?.takeIf { it.matches(Regex("[a-z0-9]{2,5}")) } ?: "mp4"
        val uri = runCatching { Uri.parse(raw) }.getOrNull()
        if (uri == null || uri.scheme != "https" || uri.host?.lowercase(Locale.ROOT)?.endsWith(".googlevideo.com") != true) {
            call.reject("Invalid YouTube media stream URL.")
            return
        }
        thread(name = "NiceDownloader-stream") {
            var connection: HttpURLConnection? = null
            var destination: Uri? = null
            try {
                connection = URL(raw).openConnection() as HttpURLConnection
                connection.connectTimeout = 20000
                connection.readTimeout = 30000
                connection.instanceFollowRedirects = true
                connection.setRequestProperty("User-Agent", "Mozilla/5.0")
                connection.connect()
                val code = connection.responseCode
                if (code !in 200..299) throw IllegalStateException("Media server returned HTTP $code")
                val total = connection.contentLengthLong
                val safeName = title.replace(Regex("[\\\\/:*?\"<>|\\r\\n]"), "_").trim().take(100).ifBlank { "YouTube video" } + "." + extension
                val values = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, safeName)
                    put(MediaStore.MediaColumns.MIME_TYPE, if (extension == "webm") "video/webm" else if (extension == "m4a") "audio/mp4" else "video/mp4")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/NiceDownloader")
                        put(MediaStore.MediaColumns.IS_PENDING, 1)
                    }
                }
                destination = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    getContext().contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                } else {
                    val folder = java.io.File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "NiceDownloader")
                    if (!folder.exists()) folder.mkdirs()
                    val file = java.io.File(folder, safeName)
                    Uri.fromFile(file)
                } ?: throw IllegalStateException("Could not create destination file")
                val output = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) getContext().contentResolver.openOutputStream(destination!!) else java.io.FileOutputStream(java.io.File(destination!!.path!!))
                if (output == null) throw IllegalStateException("Could not open destination file")
                BufferedInputStream(connection.inputStream).use { input ->
                    BufferedOutputStream(output).use { out ->
                        val buffer = ByteArray(64 * 1024)
                        var done = 0L
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            out.write(buffer, 0, count)
                            done += count
                            val progress = if (total > 0) (done * 100.0 / total).toInt().coerceIn(0, 99) else 0
                            val event = JSObject().apply {
                                put("progress", progress)
                                put("etaSeconds", 0)
                                put("message", "Downloading…")
                            }
                            notifyListeners("downloadProgress", event)
                        }
                    }
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    getContext().contentResolver.update(destination!!, ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }, null, null)
                }
                val result = JSObject().apply {
                    put("success", true)
                    put("publicDownload", true)
                    put("fileName", safeName)
                    put("filePath", "Download/NiceDownloader/$safeName")
                    put("folder", "Download/NiceDownloader")
                }
                call.resolve(result)
            } catch (error: Exception) {
                destination?.let { runCatching { getContext().contentResolver.delete(it, null, null) } }
                call.reject("Download failed: ${error.message ?: "network error"}")
            } finally {
                connection?.disconnect()
            }
        }
    }
}
