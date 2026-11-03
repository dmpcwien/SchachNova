plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
 namespace = "at.schachnova.app"
 compileSdk = 35
 defaultConfig { applicationId = "at.schachnova.app"; minSdk = 26; targetSdk = 35; versionCode = 5; versionName = "1.0.3" }
 signingConfigs {
  create("secureRelease") {
   val keyFile = System.getenv("SCHACHNOVA_KEYSTORE_PATH")
   if (!keyFile.isNullOrBlank()) {
    storeFile = file(keyFile)
    storePassword = System.getenv("SCHACHNOVA_STORE_PASSWORD")
    keyAlias = System.getenv("SCHACHNOVA_KEY_ALIAS")
    keyPassword = System.getenv("SCHACHNOVA_KEY_PASSWORD")
   }
  }
 }
 buildTypes {
  getByName("release") {
   isMinifyEnabled = false
   signingConfig = signingConfigs.getByName("secureRelease")
  }
 }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget = "17" }
}
dependencies { implementation("androidx.webkit:webkit:1.12.1") }
