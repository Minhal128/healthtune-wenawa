# HealthTune Mobile

<div align="center">
  <img src="./assets/images/healthtune.png" alt="HealthTune Logo" width="200"/>
  
  **A professional mobile application for healthcare providers to manage patient sessions and clinical notes**
  
  [![Expo](https://img.shields.io/badge/Expo-~53.0-000020.svg?style=flat-square&logo=EXPO&labelColor=000020&logoColor=FFF)](https://expo.dev)
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.4-61DAFB.svg?style=flat-square&logo=react&labelColor=20232a)](https://reactnative.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6.svg?style=flat-square&logo=typescript&labelColor=20232a&logoColor=3178C6)](https://www.typescriptlang.org)
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)

---

## 🎯 Overview

HealthTune is a comprehensive mobile application designed for healthcare professionals to streamline their clinical workflow. The app enables practitioners to record therapy sessions, manage patient information, create quick clinical notes, and organize session histories efficiently.

Built with React Native and Expo, HealthTune provides a seamless cross-platform experience for iOS and Android devices, with features tailored specifically for healthcare environments.

---

## ✨ Features

### 🎙️ **Audio Recording & Playback**
- Record high-quality audio notes during therapy sessions
- Playback controls with seek functionality
- Background audio support for iOS
- Audio transcription services integration

### 👥 **Patient Management**
- Comprehensive patient selection and tracking
- Patient profile cards with quick access
- Session history for each patient
- Secure patient data handling

### 📝 **Clinical Notes**
- Quick note creation with voice input
- Template-based note generation
- Session-specific note organization
- Markdown support for rich text formatting

### 🔐 **Secure Authentication**
- Clerk authentication integration
- Google SSO support
- Secure token management with Expo SecureStore
- Protected routes and screens

### 📅 **Session Management**
- Create and manage therapy sessions
- Track appointment schedules
- Filter sessions by date
- Detailed session views with notes

### 🌍 **Multi-language Support**
- Language selection for transcription
- Localized content support
- Country flag indicators

### 🎨 **Modern UI/UX**
- Beautiful gradient headers
- Bottom sheet modals
- Haptic feedback
- Smooth animations with Reanimated
- Dark mode support

---

## 🛠️ Tech Stack

### **Core Technologies**
- **React Native** (0.79.4) - Mobile framework
- **Expo** (~53.0) - Development platform
- **TypeScript** (5.8.3) - Type safety
- **Expo Router** (5.1.0) - File-based navigation

### **State Management & Data**
- **TanStack Query** (5.80.7) - Server state management
- **React Hook Form** (7.58.1) - Form handling
- **Zod** (3.25.67) - Schema validation
- **Axios** (1.10.0) - HTTP client

### **Authentication**
- **Clerk Expo** (2.13.1) - Authentication & user management
- **Expo SecureStore** - Secure credential storage

### **UI Components & Styling**
- **Gorhom Bottom Sheet** (5.1.6) - Modal bottom sheets
- **Expo Linear Gradient** - Gradient backgrounds
- **React Native Reanimated** (3.17.4) - Smooth animations
- **Expo Blur** - Blur effects
- **Sonner Native** (0.21.0) - Toast notifications

### **Media & Audio**
- **Expo Audio** (0.4.6) - Audio recording and playback
- **Expo Haptics** - Haptic feedback

### **Development Tools**
- **ESLint** - Code linting
- **Babel** - JavaScript compiler
- **Metro** - JavaScript bundler

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Git** - [Download](https://git-scm.com/)

### **For iOS Development**
- **macOS** with Xcode installed
- **iOS Simulator** or physical iOS device
- **CocoaPods** - Install with: `sudo gem install cocoapods`

### **For Android Development**
- **Android Studio** with Android SDK
- **Android Emulator** or physical Android device

---

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wenawa/healthtune_mobile.git
   cd healthtune_mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory and add your configuration:
   ```env
   EXPO_PUBLIC_API_URL=your_api_url_here
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   ```

4. **Install iOS dependencies** (macOS only)
   ```bash
   npx pod-install
   ```

---

## 🏃 Running the Application

### **Development Mode**

Start the Expo development server:
```bash
npm start
```

This will open the Expo DevTools in your browser. From there, you can:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your physical device

### **Platform-Specific Commands**

**Run on iOS:**
```bash
npm run ios
```

**Run on Android:**
```bash
npm run android
```

**Run on Web:**
```bash
npm run web
```

### **Development Build**

For features requiring native modules (like authentication):
```bash
npx expo run:ios
# or
npx expo run:android
```

---

## 📁 Project Structure

```
healthtune_mobile/
├── app/                          # App screens (file-based routing)
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/                   # Main tab navigation screens
│   │   ├── home.tsx
│   │   ├── session.tsx
│   │   ├── notes.tsx
│   │   ├── session-history.tsx
│   │   ├── profile.tsx
│   │   └── _layout.tsx
│   ├── (primary)/                # Stack navigation screens
│   │   ├── session-details.tsx
│   │   ├── session-notes.tsx
│   │   ├── create-quick-notes.tsx
│   │   ├── note-player.tsx
│   │   └── _layout.tsx
│   ├── index.tsx                 # Entry point
│   └── _layout.tsx               # Root layout
├── features/                     # Feature modules
│   ├── auth/                     # Authentication
│   │   ├── components/
│   │   └── hooks/
│   ├── patients/                 # Patient management
│   │   ├── api/
│   │   ├── components/
│   │   └── types/
│   ├── patient-sessions/         # Session management
│   │   ├── api/
│   │   └── types/
│   ├── quick-notes/              # Note creation
│   │   ├── api/
│   │   └── types/
│   ├── templates/                # Note templates
│   │   ├── api/
│   │   ├── components/
│   │   └── types/
│   ├── appointments/             # Appointment scheduling
│   │   └── api/
│   └── shared/                   # Shared utilities
│       ├── components/
│       ├── hooks/
│       ├── utils/
│       └── api/
├── utils/                        # Global utilities
│   ├── config/                   # App configuration
│   └── constants/                # App constants
├── assets/                       # Static assets
│   ├── images/
│   └── fonts/
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

### **Key Directories Explained**

- **`/app`** - Contains all screens using Expo Router's file-based routing system
- **`/features`** - Feature-based modules following domain-driven design principles
- **`/utils`** - Global utilities, configurations, and constants
- **`/assets`** - Static assets like images, fonts, and icons

---

## 💻 Development

### **Code Linting**
```bash
npm run lint
```

### **Type Checking**
```bash
npx tsc --noEmit
```

### **Architecture Patterns**

- **Feature-based structure** - Code organized by feature domains
- **Custom hooks** - Reusable logic extraction
- **API services** - Centralized API calls with React Query
- **Type safety** - Full TypeScript coverage
- **Form validation** - Zod schemas with React Hook Form

### **Key Development Features**

1. **Audio Recording** - Implemented in `features/shared/hooks/useAudioRecording.ts`
2. **Audio Playback** - Implemented in `features/shared/hooks/useAudioPlayer.ts`
3. **Date Utilities** - Helper functions in `features/shared/utils/dateUtils.ts`
4. **API Client** - Configured Axios instance with interceptors in `utils/config/`

---

## 🏗️ Building for Production

### **EAS Build (Recommended)**

HealthTune uses Expo Application Services (EAS) for production builds.

**Build for iOS:**
```bash
eas build --platform ios
```

**Build for Android:**
```bash
eas build --platform android
```

**Build for both platforms:**
```bash
eas build --platform all
```

### **Submit to App Stores**

**iOS App Store:**
```bash
eas submit --platform ios
```

**Google Play Store:**
```bash
eas submit --platform android
```

### **Configuration**

EAS build configuration is defined in `eas.json`. Update this file to customize your build settings.

---

## 🤝 Contributing

We welcome contributions to HealthTune! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Code Standards**

- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Ensure all lints pass before committing
- Test on both iOS and Android when possible

---

## 📄 License

This project is proprietary software owned by Wenawa.

---

## 📞 Support

For questions or support, please contact the development team.

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Authentication by [Clerk](https://clerk.com)
- State management with [TanStack Query](https://tanstack.com/query)
- UI components inspired by modern design principles

---

<div align="center">
  Made with ❤️ by Wenawa Team
</div>
