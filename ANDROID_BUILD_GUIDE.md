# 📱 ANDROID APK GENERATION GUIDE FOR "DON'T TOUCH THE RED"

This project is fully prepared for Android APK generation using 4 different methods, from instant 1-click cloud generation to local Android Studio compilation.

---

## ⚡ Method 1: Instant 1-Click Online APK Generator (No tools required)

Microsoft & Google maintain **PWABuilder**, an official, free tool that converts any HTML5 web game into an installable Android APK and Google Play Store AAB:

1. Deploy or host your `dont-touch-the-red` game (e.g. on GitHub Pages, Vercel, Netlify, or your own server).
2. Go to **[https://www.pwabuilder.com/](https://www.pwabuilder.com/)**
3. Enter your game's URL and click **Start**.
4. Click **"Package for Android"**.
5. Click **Download APK**.
6. Transfer the `.apk` file to your Android phone or emulator (e.g. MuMuPlayer) and tap to install!

---

## 🛠️ Method 2: Build with Android Studio (Full Native Project Included)

The complete native Android project is already generated and located in:
📂 `dont-touch-the-red/android/`

### Features included in the native project:
- **Immersive Fullscreen Sticky Mode:** Automatically hides Android status and navigation bars.
- **Hardware Acceleration:** Native GPU acceleration enabled for smooth 60 FPS Canvas rendering.
- **Web Audio Unlocked:** Audio plays seamlessly without user gesture restrictions.
- **Orientation Lock:** Locked to portrait orientation for consistent arcade gameplay.
- **Accidental Exit Protection:** Double-tap back button to exit, with automatic game pause.

### Steps to build:
1. Open **Android Studio**.
2. Click **Open** and select the folder:
   `C:\Users\FAST COMPUTERS\.gemini\antigravity\scratch\dont-touch-the-red\android`
3. Wait for Gradle sync to complete (automatic).
4. In the top menu, click:
   **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
5. Once finished, click **locate** in the popup notification to find your compiled:
   `app-debug.apk` in `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## ☁️ Method 3: Automated Free GitHub Actions CI/CD (Zero Local Setup)

A production-ready GitHub Actions workflow is pre-configured in:
📂 `.github/workflows/build-apk.yml`

1. Push this repository to GitHub.
2. Go to the **Actions** tab on your GitHub repository.
3. The **"Build Android APK"** workflow runs automatically.
4. When finished (typically ~90 seconds), download the compiled **`DontTouchTheRed-Debug-APK`** artifact directly from GitHub!

---

## 📲 Method 4: Instant Direct Install on Mobile (WebAPK)

Since the game includes a complete **`manifest.json`** and **`sw.js`** (Service Worker):
1. Open the game in Chrome or Samsung Internet on any Android phone.
2. Tap the browser menu (three dots `⋮`) and select **"Install App"** or **"Add to Home Screen"**.
3. Android will automatically package and install a native **WebAPK** directly on your device with an app drawer icon, standalone window, and offline gameplay!
