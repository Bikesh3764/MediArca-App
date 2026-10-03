# MediArca Mobile — Android App & Ecosystem

The official native Android mobile application for **MediArca**, engineered around the **Apple Human Interface Guidelines (HIG)** and connected in real time to the shared **Supabase PostgreSQL** database and **Render API** backend.

---

## 📱 Features

- **Live Doctor Discovery**: Search verified healthcare practitioners across 30+ specialties with live cabin presence indicators (`In Cabin`, `Stepped Out`, `Away`).
- **Atomic Queue Booking**: Book appointments for yourself or family members with atomic token allocation (`#01`, `#02`, ...) and real-time wait-time estimators.
- **Apple Wallet Live Queue Pass**: Digital wallet-style queue ticket that dynamically updates every few seconds as doctors call patients into the cabin.
- **Clinic QR Standee Check-In**: High-speed camera scanner to check in by scanning the QR standee in the clinic lobby or by typing the 6-digit kiosk code.
- **Consultation History**: Complete record of all past appointments, diagnoses, and doctor's advice notes.
- **Doctor Cabin Console**: Mobile workspace for doctors to toggle their cabin availability status (`In Cabin`, `Stepped Out`, `Off Duty`), view the live patient waiting room, and call the next patient with a single tap.
- **Zero Prepayment Paywall**: Pay-at-clinic model with zero upfront barrier.

---

## 🎨 Apple Design System (`DESIGN.md`)

- **Typography**: San Francisco Pro (`SF Pro Display` & `SF Pro Text`) with negative letter-spacing for headlines and comfortable mobile line heights.
- **Color Palette**:
  - **Action Blue**: `#0066cc` (Primary interactive color)
  - **Parchment Canvas**: `#f5f5f7` (Soft, glare-free background)
  - **Dark Ink**: `#1d1d1f` (High contrast, readable typography)
  - **Hairline Dividers**: `#e0e0e0` / `#f0f0f0`
- **Pill Shapes & Tactile Touch**: Pill-shaped primary action buttons (`rounded-full`) with spring press feedback (`active:scale-95`).
- **Clear & Direct Language**: Clean, everyday words with zero confusing fluff or unnecessary jargon.

---

## 🔄 Real-Time Shared Ecosystem

Both the MediArca Web platform and this Mobile Application communicate directly with the same backend:
- **API Endpoint**: `https://mediarca-mdwk.onrender.com/api`
- **Database**: Supabase PostgreSQL Cloud
- **Synchronization**: Any appointment booked on mobile instantly appears on the doctor's web console; calling a patient from the web console immediately triggers the mobile pass to display **"Your Turn!"**.

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Mobile Engine**: Capacitor 7 Android
- **Styling**: Tailwind CSS (Apple HIG design tokens)
- **Icons**: Lucide Icons
- **Native Permissions**: Camera (`@capacitor/camera`), Storage (`@capacitor/preferences`), Status Bar (`@capacitor/status-bar`)

---

## 🚀 Building the APK Locally

### Prerequisites
- Node.js 20+
- Java JDK 17 or 21 (`JAVA_HOME`)
- Android SDK Platform 34/35 (`ANDROID_HOME`)

### Build Commands
```bash
# 1. Install dependencies
npm install

# 2. Build web bundle
npm run build

# 3. Sync Capacitor Android project
npx cap sync android

# 4. Compile Debug APK
cd android
./gradlew assembleDebug
```

The compiled APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
and also copied to:
```
dist-apk/MediArca.apk
```
