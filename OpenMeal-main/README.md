# SmartNutri - AI-Powered Nutrition Tracker

## Overview

SmartNutri is an open-source, privacy-focused mobile nutrition tracker built with React Native and Expo. It leverages Google's Gemini API to provide users with detailed nutritional analysis from photos of their meals. All user data is stored locally on-device, ensuring complete privacy.

Developed by **Euwan Abogadie** — Mapua Malayan Colleges.

---

## Table of Contents

- [Technical Stack](#technical-stack)
- [Project Architecture](#project-architecture)
- [Core Functionality](#core-functionality)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [License](#license)

---

## Technical Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **AI:** [Google Gemini API](https://ai.google.dev/) for multimodal meal analysis
- **Health Data:** [Android Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
- **Storage:** Local file system via `expo-file-system` and `expo-secure-store`
- **Testing:** [Jest](https://jestjs.io/)

---

## Project Architecture

```
smartnutri/
├── app/                  # Screens and navigation (Expo Router)
│   └── (tabs)/           # Tab-based navigation screens
├── components/           # Reusable UI components
├── services/             # Business logic and API services
├── hooks/                # Custom React hooks
├── constants/            # App-wide constants (colors, fonts)
└── types/                # TypeScript type definitions
```

- **`app/`** — File-based routing via Expo Router
- **`components/`** — Modular UI components including modals, cards, and charts
- **`services/`** — Core logic: `GeminiService`, `FileSystemStorageService`, `HealthConnectService`, etc.
- **`hooks/`** — Theme and utility hooks
- **`constants/`** — Color palette, font definitions

---

## Core Functionality

### AI Meal Analysis
`GeminiService.ts` sends base64-encoded meal images to the Google Gemini API and receives structured JSON back containing calories, protein, carbohydrates, fat, and meal insights.

### Before & After Analysis
Users can take a photo before and after eating. SmartNutri compares both images and calculates nutrition only for what was actually consumed.

### Text-Based Logging
Users can describe their meal in text if no photo is available. The AI interprets the description and estimates nutritional values.

### Health Connect (Android)
`HealthConnectService.ts` syncs meal nutrition data to Android's Health Connect for integration with other health apps.

### Local Data Storage
All data — meal history, user profile, daily goals — is stored on-device using `expo-file-system`. Nothing is sent to external servers except the Gemini API call.

### Export & Import
Users can export all their data as a JSON file and re-import it on a new device.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (LTS version recommended)
- [Expo Go](https://expo.dev/go) installed on your Android or iOS device
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/SmartNutri.git
   cd SmartNutri
   ```

2. **Navigate to the app source:**
   ```bash
   cd "App Source Code"
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

---

## Running the App

1. **Start the development server:**
   ```bash
   npx expo start --go
   ```

2. **Scan the QR code** with the Expo Go app on your phone.

3. On first launch, complete the onboarding — enter your profile details and your Gemini API key.

> **Note:** Your phone and PC must be on the same Wi-Fi network.

---

## License

MIT License — Copyright (c) 2025 Euwan Abogadie, Mapua Malayan Colleges.

See [LICENSE](./LICENSE) for full details.