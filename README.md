# ClassWaves Student PWA

Progressive Web App for students to join classroom sessions and participate in group discussions.

## Features

- 📱 **PWA Support**: Install as app on iPad/tablets
- 🎙️ **Audio Recording**: Simple one-tap recording interface
- 🔄 **Offline Support**: Works without internet, syncs when reconnected
- 👥 **Group Management**: Auto-join assigned groups
- 🔐 **Secure**: Student privacy with COPPA compliance

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- PWA with Service Workers
- WebRTC for audio recording
- Socket.io for real-time updates

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## PWA Features

- **Offline Mode**: Recordings stored locally when offline
- **Background Sync**: Automatic upload when connection restored
- **Push Notifications**: Session start/end alerts
- **App-like Experience**: Full screen, no browser UI

## Student Interface

1. **Join Session**: Enter teacher-provided code
2. **Group Assignment**: Automatically placed in groups
3. **Audio Recording**: One-tap to start/stop recording
4. **Visual Feedback**: Audio level indicators
5. **Offline Indicator**: Clear connection status

## Security & Privacy

- No personal data stored on device
- Anonymous IDs for COPPA compliance
- Audio encrypted during transmission
- Automatic data cleanup after session
