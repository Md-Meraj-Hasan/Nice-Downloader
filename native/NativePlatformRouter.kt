package __PACKAGE__

import android.net.Uri

/**
 * Explicit platform gate for the native downloader.
 *
 * This is deliberately separate from extraction: a URL is accepted only for
 * the three platforms requested by the app. It does not claim that a private,
 * login-protected, or unsupported media page can be downloaded.
 */
internal object NativePlatformRouter {
    enum class Platform { YOUTUBE, INSTAGRAM, FACEBOOK }

    data class Target(val platform: Platform, val canonicalUrl: String)

    fun resolve(raw: String?): Target {
        require(!raw.isNullOrBlank()) { "Paste a media link first." }
        val uri = Uri.parse(raw.trim())
        val scheme = uri.scheme?.lowercase()
        require(scheme == "http" || scheme == "https") {
            "Only HTTP and HTTPS links are supported."
        }
        val host = uri.host?.lowercase()?.removePrefix("www.")
            ?: throw IllegalArgumentException("The link has no valid host.")

        val platform = when {
            host == "youtube.com" || host.endsWith(".youtube.com") ||
                host == "youtu.be" || host.endsWith(".youtu.be") -> Platform.YOUTUBE
            host == "instagram.com" || host.endsWith(".instagram.com") -> Platform.INSTAGRAM
            host == "facebook.com" || host.endsWith(".facebook.com") ||
                host == "fb.watch" || host.endsWith(".fb.watch") -> Platform.FACEBOOK
            else -> throw IllegalArgumentException(
                "Unsupported website. Nice Downloader supports YouTube, Instagram and Facebook."
            )
        }
        return Target(platform, uri.toString())
    }
}
