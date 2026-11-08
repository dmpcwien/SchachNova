package at.schachnova.app

import android.app.Activity
import android.os.Bundle
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import android.os.Process
import org.json.JSONObject
import java.io.ByteArrayOutputStream
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
    private val saveRequest = 6101
    private val importRequest = 6102
    private var queuedExport: String? = null

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

    inner class Files {
        @JavascriptInterface
        fun saveFile(filename: String, mime: String, text: String) {
            if (text.length > 800000 || mime !in listOf("application/json", "application/x-chess-pgn", "text/plain")) return
            val safeName = filename.replace(Regex("[^a-zA-Z0-9._-]"), "_").take(100)
            runOnUiThread {
                queuedExport = text
                try {
                    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = mime
                        putExtra(Intent.EXTRA_TITLE, safeName)
                    }
                    startActivityForResult(intent, saveRequest)
                } catch (e: Exception) {
                    queuedExport = null
                    Toast.makeText(this@MainActivity, "Speichern nicht möglich", Toast.LENGTH_LONG).show()
                }
            }
        }
        @JavascriptInterface
        fun openJson() {
            runOnUiThread {
                try {
                    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "application/json"
                        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/plain", "application/octet-stream"))
                    }
                    startActivityForResult(intent, importRequest)
                } catch (e: Exception) {
                    Toast.makeText(this@MainActivity, "Dateiauswahl nicht möglich", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    inner class Performance {
        @JavascriptInterface
        fun sample(): String {
            val data = JSONObject()
            data.put("elapsedMs", SystemClock.elapsedRealtime())
            data.put("processCpuMs", Process.getElapsedCpuTime())
            val battery = getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            val percent = battery?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
            val current = battery?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW) ?: Int.MIN_VALUE
            data.put("batteryPercent", if (percent in 0..100) percent else JSONObject.NULL)
            data.put("batteryCurrentMicroAmp", if (current == Int.MIN_VALUE) JSONObject.NULL else current)
            return data.toString()
        }
    }

    @Deprecated("Activity result callback for the system file chooser")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == saveRequest) {
            val text = queuedExport
            queuedExport = null
            if (resultCode != RESULT_OK || text == null) return
            try {
                val uri = data?.data ?: throw IllegalStateException("Datei nicht gewählt")
                contentResolver.openOutputStream(uri)?.use { it.write(text.toByteArray(Charsets.UTF_8)) }
                    ?: throw IllegalStateException("Datei nicht beschreibbar")
                Toast.makeText(this, "Datei gespeichert", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Speichern fehlgeschlagen", Toast.LENGTH_LONG).show()
            }
        }
        if (requestCode == importRequest && resultCode == RESULT_OK) {
            try {
                val uri = data?.data ?: throw IllegalStateException("Datei nicht gewählt")
                val bytes = ByteArrayOutputStream()
                contentResolver.openInputStream(uri)?.use { input ->
                    val block = ByteArray(8192)
                    while (true) {
                        val n = input.read(block)
                        if (n < 0) break
                        if (bytes.size() + n > 800000) throw IllegalArgumentException("Sicherung zu groß")
                        bytes.write(block, 0, n)
                    }
                } ?: throw IllegalStateException("Datei nicht lesbar")
                val json = bytes.toString("UTF-8")
                if (::chessWebView.isInitialized) {
                    chessWebView.evaluateJavascript(
                        "window.schachnovaReceiveSimultanImport(" + JSONObject.quote(json) + ")", null
                    )
                }
            } catch (e: Exception) {
                Toast.makeText(this, "Import nicht möglich: " + (e.message ?: "Dateifehler"), Toast.LENGTH_LONG).show()
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
        view.addJavascriptInterface(Files(), "AndroidFiles")
        view.addJavascriptInterface(Performance(), "AndroidPerf")
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

