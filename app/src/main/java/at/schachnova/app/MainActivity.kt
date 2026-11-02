package at.schachnova.app

import android.app.Activity
import android.os.Bundle
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.content.Context
import android.widget.Toast
import android.os.SystemClock
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

class MainActivity : Activity() {
    private lateinit var chessWebView: WebView
    private var lastRootBackAt = 0L

    inner class Haptics {
        @JavascriptInterface
        fun vibrate(pattern: String) {
            val durations = pattern.split(",").mapNotNull { it.toLongOrNull()?.coerceIn(1, 500) }.take(8)
            if (durations.isEmpty()) return
            runOnUiThread {
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return@runOnUiThread
                if (!vibrator.hasVibrator()) return@runOnUiThread
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (durations.size == 1) vibrator.vibrate(VibrationEffect.createOneShot(durations[0], VibrationEffect.DEFAULT_AMPLITUDE))
                    else vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0) + durations.toLongArray(), -1))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(durations[0])
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        val view = WebView(this)
        view.settings.javaScriptEnabled = true
        view.settings.domStorageEnabled = true
        view.settings.allowFileAccess = false
        view.settings.allowContentAccess = false
        view.addJavascriptInterface(Haptics(), "AndroidHaptics")
        view.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Keep the privileged JS bridge strictly inside bundled app assets.
                val uri = request?.url ?: return true
                return uri.scheme != "https" || uri.host != "appassets.androidplatform.net"
            }

            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                return request?.url?.let { loader.shouldInterceptRequest(it) }
            }
        }
        chessWebView = view
        setContentView(view)
        view.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }
    @Deprecated("Use AndroidX OnBackPressedDispatcher when migrating from Activity")
    override fun onBackPressed() {
        if (!::chessWebView.isInitialized) {
            super.onBackPressed()
            return
        }
        chessWebView.evaluateJavascript(
            "(function(){return typeof window.schachNovaGoBack==='function' && window.schachNovaGoBack()===true})()"
        ) { result ->
            if (result != "true") {
                // Double Back within two seconds exits; first Back displays a toast.
                val now = SystemClock.elapsedRealtime()
                if (now - lastRootBackAt < 2000L) finish()
                else {
                    lastRootBackAt = now
                    Toast.makeText(this, "Zum Beenden erneut Zurück drücken", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}

