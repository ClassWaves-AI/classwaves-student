# ClassWaves Student PWA

<div align="center">

![ClassWaves](https://img.shields.io/badge/ClassWaves-Student%20App-blue)
![PWA](https://img.shields.io/badge/PWA-enabled-green)
![Next.js](https://img.shields.io/badge/next.js-14-black)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![WebRTC](https://img.shields.io/badge/webrtc-audio-orange)
![License](https://img.shields.io/badge/license-Proprietary-red)

**Progressive Web App for students to join classroom sessions and participate in group discussions**

[Features](#features) • [Quick Start](#quick-start) • [PWA Installation](#pwa-features) • [Student Interface](#student-interface) • [Privacy & Security](#security--privacy)

</div>

## Features

📱 **PWA-First Design**
- **Tablet Optimized**: Designed specifically for iPad and Android tablets
- **Installable**: Add to home screen for app-like experience
- **Offline Capable**: Works without internet, syncs when reconnected
- **Full-Screen Mode**: No browser UI distractions
- **Touch-Friendly**: Large, accessible touch targets

🎙️ **Audio & Collaboration**
- **Auto-Start WaveListener**: Automatic audio recording when session becomes active
- **3-2-1 Countdown**: Visual countdown before WaveListener activation
- **One-Tap Recording**: Simple, intuitive audio recording interface
- **Real-time Feedback**: Visual audio level indicators and status
- **Group Auto-Assignment**: Seamless placement into collaborative groups
- **Live Transcription**: Real-time speech-to-text feedback (when enabled)
- **Session Synchronization**: Automatic session state management

🔒 **Privacy & Compliance**
- **COPPA Compliant**: Built-in protections for students under 13
- **Anonymous IDs**: No personal data storage on device
- **Encrypted Transmission**: All audio data encrypted during upload
- **Automatic Cleanup**: Data removed after session completion
- **Parental Controls**: Consent management and privacy protection

## Technology Stack

### Core Technologies
- **Next.js 14**: App Router with React 18 and TypeScript
- **PWA Support**: Service workers, manifest, and offline capabilities
- **WebRTC**: Browser-native audio recording and streaming
- **Socket.IO**: Real-time communication with backend
- **Tailwind CSS**: Utility-first styling with touch optimization

### Audio & Media
- **MediaRecorder API**: High-quality audio capture
- **Web Audio API**: Audio processing and level monitoring
- **IndexedDB**: Local storage for offline recordings

### Real-time & Storage
- **WebSocket**: Live session updates and group coordination
- **Service Workers**: Background sync and push notifications
- **@classwaves/shared**: Shared types and validation

## Quick Start

### Prerequisites
- **Modern Browser**: Chrome, Safari, Firefox, or Edge (with WebRTC support)
- **ClassWaves Backend**: Must be running on configured URL
- **Microphone Access**: Required for audio recording functionality
- **Tablet/Mobile Device**: Optimized for touch interfaces

### Environment Setup

Create `.env.local` with the following configuration:

```bash
# === API Configuration ===
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# === PWA Configuration ===
NEXT_PUBLIC_APP_NAME=ClassWaves Student
NEXT_PUBLIC_APP_VERSION=1.0.0

# === Audio Settings ===
NEXT_PUBLIC_AUDIO_SAMPLE_RATE=44100
NEXT_PUBLIC_AUDIO_CHUNK_SIZE=4096
NEXT_PUBLIC_MAX_RECORDING_DURATION=300000

# === Development ===
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
```

### Installation & Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd classwaves-student
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Verification
```bash
# Check application health
curl http://localhost:3003/api/health

# Test PWA manifest
curl http://localhost:3003/manifest.json

# Verify service worker
open http://localhost:3003 # Check dev tools → Application → Service Workers
```

Open [http://localhost:3003](http://localhost:3003) to view the application.

## Student Interface

### Landing Page
The student app opens to a clean, simple interface designed for ease of use:

```
🏠 ClassWaves Student Home
├── 🎯 Join Session Card
│   ├── Large session code input field
│   ├── "Join Session" call-to-action button
│   ├── Visual feedback for invalid codes
│   └── Loading states and error handling
│
├── 📱 App Installation Prompt
│   ├── "Add to Home Screen" suggestion
│   ├── PWA benefits explanation
│   └── Installation instructions
│
└── 🔒 Privacy Notice
    ├── COPPA compliance information
    ├── Data usage explanation
    └── Contact information for parents
```

### Session Interface
Once joined, students see a focused collaboration interface with:
- **Session Info**: Title, teacher name, time remaining, connection status
- **Group Assignment**: Group name, color, member count, ready status
- **Recording Controls**: One-tap record button with visual feedback
- **Status Indicators**: Microphone permission, internet connection, pending uploads

## PWA Features

### Installation Experience
- **iOS Safari**: Guided instructions for "Add to Home Screen"
- **Android Chrome**: Native install banner with custom messaging
- **Desktop**: PWA install prompt with benefits explanation

### Offline Capabilities
- **Offline Recording**: Audio captured and stored locally when offline
- **Background Sync**: Automatic upload when connection restored
- **Push Notifications**: Session start/end alerts
- **App-like Experience**: Full screen, no browser UI
- **Service Workers**: Background processing and caching

### Manifest Configuration
```json
{
  "name": "ClassWaves Student",
  "short_name": "ClassWaves",
  "description": "Join classroom sessions and participate in group discussions",
  "theme_color": "#3b82f6",
  "display": "standalone",
  "orientation": "portrait",
  "categories": ["education", "productivity"]
}
```

## Audio Recording

### WaveListener Auto-Start
- **Intelligent Activation**: WaveListener automatically starts when sessions become active
- **Visual Countdown**: 3-2-1 countdown with pulse animation before recording begins
- **Permission Gating**: Auto-start only occurs when microphone permissions are granted
- **Error Handling**: Robust handling of permission revocation and device issues
- **Manual Override**: Pause/resume/stop controls available during auto-recording
- **Clean Termination**: Automatic cleanup when sessions end or users leave

### Recording Capabilities
- **High-Quality Audio**: 44.1kHz sample rate, optimized for speech
- **Real-time Processing**: Live audio level monitoring and feedback
- **Streaming Upload**: Audio chunks uploaded in real-time
- **Error Recovery**: Graceful handling of recording interruptions

### Audio Configuration
```typescript
interface AudioSettings {
  sampleRate: 44100;
  channelCount: 1; // Mono for speech
  mimeType: 'audio/webm;codecs=opus';
  audioBitsPerSecond: 64000; // Optimized for speech
  echoCancellation: true;
  noiseSuppression: true;
  autoGainControl: true;
}
```

## Group Management

### Automatic Assignment
- **Smart Assignment**: Balanced group distribution
- **Visual Identity**: Color-coded group indicators
- **Member Awareness**: Real-time member count and status
- **Ready Status**: Clear indication when group is ready

### Group Features
- **Group Name & Color**: Visual group identification
- **Member Count**: Live updates of group membership
- **Ready Status**: Indication when all members are connected
- **Seamless Transitions**: Smooth group assignment updates

## Security & Privacy

### COPPA Compliance
- **No Personal Data**: Only anonymous session-specific IDs stored
- **Data Minimization**: Audio-only, no behavioral tracking
- **Parental Controls**: Consent management and access controls
- **Automatic Cleanup**: Complete data removal after session

### Security Features
- **Encrypted Transmission**: All audio data encrypted before upload
- **Anonymous IDs**: Session-specific identification only
- **Secure Permissions**: Minimal required permissions (microphone only)
- **Data Protection**: No persistent storage of personal information

## Development

### Development Scripts
```bash
# Development server
npm run dev              # Start development server with hot reload
npm run build           # Build production bundle
npm run start           # Start production server

# PWA Development
npm run build:pwa       # Build with PWA optimizations
npm run analyze:bundle  # Analyze bundle size and dependencies
npm run test:pwa        # Test PWA features and service worker

# Code Quality
npm run lint            # ESLint code analysis
npm run type-check      # TypeScript type checking
npm run format          # Prettier code formatting

# Testing
npm test                # Run unit tests
npm run test:e2e        # End-to-end tests
npm run test:audio      # Audio recording tests
```

### Code Organization
```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── page.tsx           # Landing/join page
│   ├── join/              # Session joining flow
│   ├── session/           # Active session interface
│   └── offline/           # Offline status page
├── components/             # UI components
│   ├── audio/             # Audio recording components
│   ├── session/           # Session-specific components
│   └── common/            # Shared components
├── features/               # Feature modules
│   ├── audio-recording/   # Audio capture and processing
│   ├── session-joining/   # Session join workflow
│   └── offline-sync/      # Offline data management
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and services
├── stores/                 # State management
└── utils/                  # Helper functions
```

## Repository Integration

### Platform Integration
The student app integrates seamlessly with the ClassWaves platform:

- **Real-time Communication**: WebSocket connection to backend for live updates
- **Audio Streaming**: Direct audio upload to backend processing pipeline
- **Session Coordination**: Synchronized session state with teacher dashboard
- **Type Safety**: Shared TypeScript interfaces via @classwaves/shared

### Platform Requirements
To run the complete ClassWaves platform:

```bash
# 1. Start backend (required)
cd classwaves-backend && npm run dev

# 2. Start teacher frontend (optional)
cd classwaves-frontend && npm run dev

# 3. Start student app
cd classwaves-student && npm run dev

# Platform verification
curl http://localhost:3001/api/v1/health  # Backend
curl http://localhost:3000/api/health     # Frontend (optional)
curl http://localhost:3003/api/health     # Student app
```

## Contributing

### Development Guidelines
1. **PWA-First**: All features must work offline and in PWA mode
2. **Touch-Optimized**: Design for finger navigation and touch interaction
3. **Privacy-Focused**: Maintain COPPA compliance in all features
4. **Performance**: Optimize for mobile networks and older devices
5. **Audio Quality**: Ensure high-quality audio recording and streaming

### Testing Requirements
- **Device Testing**: Test on actual iOS Safari and Android Chrome
- **Audio Testing**: Verify recording quality and real-time upload
- **PWA Testing**: Test offline functionality and service worker behavior
- **Privacy Testing**: Ensure COPPA compliance and data protection

---

## License

**Proprietary** - ClassWaves Educational Platform

© 2025 ClassWaves. All rights reserved. This software is proprietary and confidential.

---

## Support & Documentation

- **PWA Installation Guide**: See browser-specific installation instructions
- **Audio Setup Guide**: Microphone permissions and troubleshooting
- **Privacy Policy**: Complete privacy and data protection information
- **Parent Information**: COPPA compliance and parental controls

For technical support or questions about the student app, please contact the development team.
