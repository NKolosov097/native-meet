# Native Meet - LiveKit React Native Demo

A video calling app built with the LiveKit React Native SDK, Expo and TypeScript.

## Features

- 🎥 Real-time video calls
- 🎙️ Audio chat
- 📱 Cross-platform (iOS/Android)
- 🔧 Simple setup with Expo
- 🎛️ Camera and microphone controls
- 📝 Full TypeScript typing
- ♿ Accessibility support
- 🛡️ Error handling and validation

## Installation and setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up a LiveKit server

You need a LiveKit server to run the app. You can either:

- Use [LiveKit Cloud](https://cloud.livekit.io/)
- Run a [self-hosted LiveKit server](https://docs.livekit.io/realtime/self-hosting/deployment/)

### 3. Get an access token

You need a JWT token to join a room. You can:

- Generate a token with the [LiveKit CLI](https://docs.livekit.io/realtime/server/generating-tokens/)
- Use the LiveKit Cloud web interface
- Create a token programmatically on your own server

### 4. Run the app

⚠️ **Important**: this app uses LiveKit native modules and requires an Expo Development Build, not Expo Go.

```bash
# Initial setup (generates the native folders)
npx expo prebuild --clean

# Development with the Development Client
npx expo start --dev-client

# iOS simulator (macOS only)
npx expo run:ios

# Android emulator
npx expo run:android

# Web version (limited functionality)
npx expo start --web

# Cloud build for iOS (via EAS)
eas build --platform ios --profile development
```

#### First run:

1. **Android**: `npx expo run:android` (installs the Development Client automatically)
2. **iOS**: requires macOS or a cloud build via EAS
3. **Web**: works, but without video/audio features

## Usage

1. Start the app
2. Enter your LiveKit server URL (for example: `wss://your-server.livekit.cloud`)
3. Enter a valid access token
4. Press "Connect" to join the room

## Configuration

### Permissions

The app automatically requests the following permissions:

**iOS:**

- `NSCameraUsageDescription` - camera access
- `NSMicrophoneUsageDescription` - microphone access

**Android:**

- `android.permission.CAMERA` - camera access
- `android.permission.RECORD_AUDIO` - microphone access
- `android.permission.MODIFY_AUDIO_SETTINGS` - change audio settings
- `android.permission.INTERNET` - internet access
- `android.permission.ACCESS_NETWORK_STATE` - check network state
- `android.permission.WAKE_LOCK` - prevent the screen from locking

### Expo plugins

The project is configured with:

- `@livekit/react-native-expo-plugin` - the main LiveKit plugin for Expo

## Project structure

```
native-meet/
├── App.tsx              # Main app component (TypeScript)
├── types/               # TypeScript types
│   └── index.ts         # Core interfaces and types
├── app.json             # Expo configuration
├── tsconfig.json        # TypeScript configuration
├── expo-env.d.ts        # Expo type definitions
├── package.json         # Project dependencies
├── assets/              # App assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
└── README.md           # Documentation
```

## TypeScript

The project is fully typed with TypeScript:

- **Strict typing** - all components and functions have explicit types
- **Interfaces** - defined in `types/index.ts` for all core data structures
- **Type safety** - prevents runtime errors
- **IntelliSense** - improved IDE support

### Core types:

- `AppConfig` - connection configuration
- `ConnectionState` - connection state
- `VideoControlsState` - controls state
- `ParticipantInfo` - participant information

## App capabilities

### Connection screen

- LiveKit server URL input
- Access token input
- Input validation before connecting

### Video call screen

- Video display for all participants
- Microphone control (mute/unmute)
- Camera control (on/off)
- Participant count display
- Disconnect from room button

## Development

### Requirements

- Node.js 16+
- Expo CLI
- EAS CLI: `npm install -g eas-cli`
- iOS Simulator (for iOS development, macOS only)
- Android emulator or device (for Android development)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Debugging

```bash
# Show logs
npx expo logs

# Clear the cache
npx expo start -c

# Check TypeScript types
npx tsc --noEmit

# Check types in watch mode
npx tsc --noEmit --watch
```

## Useful links

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Native SDK](https://docs.livekit.io/client-sdk-js/react-native/)
- [Expo Documentation](https://docs.expo.dev/)
- [LiveKit Cloud](https://cloud.livekit.io/)

## Troubleshooting

### Error "The package '@livekit/react-native' doesn't seem to be linked"

This error happens when you try to use Expo Go instead of a Development Build:

1. **On Android**:

   ```bash
   npx expo run:android
   ```

2. **On iOS (macOS only)**:

   ```bash
   npx expo run:ios
   ```

3. **For iOS on Windows/Linux**:
   ```bash
   eas build --platform ios --profile development
   ```

### Other issues

- **Native module problems**: run `npx expo prebuild --clean`
- **Cache problems**: use `npx expo start -c --dev-client`
- **Metro bundler errors**: restart the development server

## Support

If you run into problems:

1. Verify you are using a Development Build, not Expo Go
2. Make sure all dependencies are installed correctly
3. Check that your LiveKit server is reachable
4. Check that the access token is valid
5. Consult the LiveKit documentation

## License

MIT License
