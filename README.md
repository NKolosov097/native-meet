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

### 2. Set up a LiveKit Cloud project

The app connects to [LiveKit Cloud](https://cloud.livekit.io/) and gets access
tokens from the project's token server, so no backend of your own is needed.

In the project settings you need two values:

- **Project URL** — the `wss://` address of the project
- **Token server ID** — enable "Token server" in the project settings and copy the ID

> The token server issues a token to anyone who asks, with any permissions. It
> is meant for local development and testing, not for production.

### 3. Configure the environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                         | Meaning                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `EXPO_PUBLIC_LIVEKIT_URL`        | Project URL, for example `wss://my-project.livekit.cloud` |
| `EXPO_PUBLIC_LIVEKIT_SANDBOX_ID` | Token server ID                                           |
| `EXPO_PUBLIC_LIVEKIT_ROOM`       | Name of the room every participant joins                  |

`.env.local` is git-ignored. If a variable is missing, the login screen says
which one and the "Join" button stays disabled.

Expo inlines `EXPO_PUBLIC_*` values into the bundle at build time, so if
Metro is already running when you edit `.env.local`, restart the dev server
(ideally `npx expo start -c --dev-client`) for the new values to take effect.

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
2. Enter your name
3. Press "Join" — the app requests an access token and joins the room from
   `EXPO_PUBLIC_LIVEKIT_ROOM`

Participants with the same name do not clash: the display name is what you
typed, while the LiveKit identity gets a random suffix.

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
├── screens/             # App screens
│   └── JoinScreen.tsx   # Login screen with the participant name input
├── components/          # UI components
│   └── room/            # Video call screen and its controls
├── services/            # External services
│   └── livekitToken.ts  # Access token fetching from the token server
├── constants/           # Colors and environment configuration
│   ├── colors.ts
│   └── env.ts
├── types/               # TypeScript types
│   └── index.ts         # Core interfaces and types
├── .env.example         # Template for .env.local
├── app.json             # Expo configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies
├── assets/              # App assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
└── README.md            # Documentation
```

## TypeScript

The project is fully typed with TypeScript:

- **Strict typing** - all components and functions have explicit types
- **Interfaces** - defined in `types/index.ts` for all core data structures
- **Type safety** - prevents runtime errors
- **IntelliSense** - improved IDE support

### Core types:

- `ConnectionState` - session state: access token and last error

## App capabilities

### Login screen

- Participant name input
- Access token requested from the LiveKit Cloud token server
- Environment configuration and connection errors shown inline

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
3. Check that `.env.local` exists and all three variables are filled in
4. Check that the token server is enabled in the LiveKit Cloud project settings
5. Consult the LiveKit documentation

## License

MIT License
