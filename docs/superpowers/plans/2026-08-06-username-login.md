# Username-Based Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Server URL and Token inputs on the login screen with a single name field — the server URL comes from environment variables and the access token from the LiveKit Cloud token server.

**Architecture:** A config module (`constants/env.ts`) is the only place that reads `process.env`; a service module (`services/livekitToken.ts`) is the only place that talks to the LiveKit Cloud token server; `screens/JoinScreen.tsx` owns the name input and its loading/error state; `App.tsx` shrinks to a single piece of state (`token`) and the branch between join screen and room.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript 5.9 (strict), `@livekit/react-native` 2.9.8, `livekit-client` 2.21.0.

**Spec:** `docs/superpowers/specs/2026-08-06-username-login-design.md`

## Global Constraints

- Code style is enforced, not optional: Prettier with `semi: false`, `singleQuote: false`, `printWidth: 80`, `tabWidth: 2`, `arrowParens: "avoid"`, `trailingComma: "all"`. ESLint runs `prettier/prettier` as an **error**.
- Imports must satisfy `import/order` with `newlines-between: "always"` and case-insensitive ascending alphabetization inside each group. Group order used by this codebase: `react`/`react-native` → `expo*` → other externals → `@livekit/**` and `livekit-*` → internal `@/...` → type-only imports. A blank line separates groups; imports inside one group have no blank lines between them.
- Internal imports use the tsconfig path aliases (`@/constants/...`, `@/screens/...`, `@/types`, `@/services/...`), matching `components/room/ActiveRoom.tsx`. Do not introduce relative `./constants/...` imports.
- Dependency versions in `package.json` are pinned exactly (no `^`, no `~`).
- Colors come from `constants/colors.ts`. `react-native/no-color-literals` and `react-native/no-inline-styles` are warnings — do not add new violations.
- `react-native/no-unused-styles` is an **error**: every key in a `StyleSheet.create` object must be referenced.
- `@typescript-eslint/no-unused-vars` is an **error**: remove imports that stop being used.
- Environment variables are read only as literal member expressions (`process.env.EXPO_PUBLIC_LIVEKIT_URL`). Expo inlines `EXPO_PUBLIC_*` values at build time; a computed lookup such as `process.env[name]` resolves to `undefined`.
- No automated test suite exists in this project (jest is not installed; there are zero test files). Every task is verified with `npm run type-check` and `npm run lint`; Task 4 adds manual verification in the running app. Do not add jest.
- `.env.local` is git-ignored (`.env*.local` in `.gitignore`) — never `git add` it.
- The code blocks in this plan are written to the project's Prettier settings but may still differ in line breaks. If `npm run lint` reports `prettier/prettier`, run `npm run lint:fix` and re-run the check instead of reformatting by hand.

## File Structure

| File                       | Responsibility                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `constants/env.ts`         | **Create.** Reads `EXPO_PUBLIC_*`, exports `env` and `configError`. The only place touching `process.env`.                       |
| `.env.example`             | **Create.** Committed template listing the three required variables.                                                             |
| `.env.local`               | **Modify (never commit).** Adds sandbox ID and room name, drops three dead keys.                                                 |
| `services/livekitToken.ts` | **Create.** Wraps `TokenSource.sandboxTokenServer`, exports `fetchParticipantToken`. The only place knowing about LiveKit Cloud. |
| `package.json`             | **Modify.** Adds `livekit-client` `2.21.0` as an explicit dependency.                                                            |
| `constants/colors.ts`      | **Modify.** Adds the placeholder text color.                                                                                     |
| `screens/JoinScreen.tsx`   | **Create.** Name input, join button, loading and error display. Owns the login screen styles.                                    |
| `types/index.ts`           | **Modify.** Removes `AppConfig`, reshapes `ConnectionState`.                                                                     |
| `App.tsx`                  | **Modify.** Shrinks to state + branch between `JoinScreen` and `LiveKitRoom`.                                                    |
| `README.md`                | **Modify.** Documents the new setup and usage.                                                                                   |

---

### Task 1: Environment configuration

**Files:**

- Create: `constants/env.ts`
- Create: `.env.example`
- Modify: `.env.local` (git-ignored — edit but never commit)

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `env: { serverUrl: string; sandboxId: string; roomName: string }` — trimmed values, empty string when a variable is unset.
  - `configError: string | null` — message listing unset variables, `null` when all three are set.

- [ ] **Step 1: Create `constants/env.ts`**

```ts
// Environment configuration for the LiveKit connection.
// Expo inlines EXPO_PUBLIC_* variables at build time, so each one has to be
// referenced by its literal name — a computed lookup resolves to undefined.

export interface Env {
  serverUrl: string
  sandboxId: string
  roomName: string
}

const VARIABLE_NAMES: Record<keyof Env, string> = {
  serverUrl: "EXPO_PUBLIC_LIVEKIT_URL",
  sandboxId: "EXPO_PUBLIC_LIVEKIT_SANDBOX_ID",
  roomName: "EXPO_PUBLIC_LIVEKIT_ROOM",
}

const rawEnv: Record<keyof Env, string | undefined> = {
  serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL,
  sandboxId: process.env.EXPO_PUBLIC_LIVEKIT_SANDBOX_ID,
  roomName: process.env.EXPO_PUBLIC_LIVEKIT_ROOM,
}

const missingNames = (Object.keys(VARIABLE_NAMES) as (keyof Env)[])
  .filter(key => !rawEnv[key]?.trim())
  .map(key => VARIABLE_NAMES[key])

// Message naming the variables that still need a value, or null when ready
export const configError: string | null =
  missingNames.length > 0
    ? `Missing environment variables: ${missingNames.join(", ")}`
    : null

export const env: Env = {
  serverUrl: rawEnv.serverUrl?.trim() ?? "",
  sandboxId: rawEnv.sandboxId?.trim() ?? "",
  roomName: rawEnv.roomName?.trim() ?? "",
}
```

- [ ] **Step 2: Create `.env.example`**

```
# LiveKit connection settings. Copy this file to .env.local and fill it in.

# WebSocket URL of the LiveKit project (Project settings -> Project URL)
EXPO_PUBLIC_LIVEKIT_URL=

# Token server ID (Project settings -> Token server -> Token server ID)
EXPO_PUBLIC_LIVEKIT_SANDBOX_ID=

# Name of the room every participant joins
EXPO_PUBLIC_LIVEKIT_ROOM=
```

- [ ] **Step 3: Update `.env.local`**

Read the file first. Set these three variables (keep any existing value of
`EXPO_PUBLIC_LIVEKIT_URL` if it already points at the project URL):

```
EXPO_PUBLIC_LIVEKIT_URL=wss://native-meet-1ogbtfoq.livekit.cloud
EXPO_PUBLIC_LIVEKIT_SANDBOX_ID=nativemeet-25p8ep
EXPO_PUBLIC_LIVEKIT_ROOM=native-meet
```

Delete these three lines — nothing reads them after this change:

```
EXPO_PUBLIC_TOKEN=...
EXPO_PUBLIC_LIVEKIT_API_KEY=...
EXPO_PUBLIC_LIVEKIT_API_SECRET=...
```

- [ ] **Step 4: Verify types and lint**

Run: `npm run type-check`
Expected: no output, exit code 0.

Run: `npm run lint`
Expected: no errors. Pre-existing warnings elsewhere are acceptable; there must be no warning or error in `constants/env.ts`.

- [ ] **Step 5: Commit**

```bash
git add constants/env.ts .env.example
git commit -m "feat(config): added env module for LiveKit connection settings"
```

`.env.local` is intentionally absent from the commit — it is git-ignored.

---

### Task 2: Token service

**Files:**

- Create: `services/livekitToken.ts`
- Modify: `package.json` (`dependencies`)

**Interfaces:**

- Consumes: `env` from `@/constants/env` (Task 1).
- Produces: `fetchParticipantToken(participantName: string): Promise<string>` — resolves with a LiveKit access token, rejects with an `Error` when the token server is unreachable or answers with a non-2xx status.

- [ ] **Step 1: Add `livekit-client` to `package.json`**

Insert the entry into `dependencies` between `"expo-status-bar"` and `"react"` so the block stays alphabetical, pinned exactly:

```json
    "livekit-client": "2.21.0",
```

Why explicitly: `livekit-client` is currently only a transitive dependency of `@livekit/react-native`. Importing a package that is not declared is unsafe — it can disappear when the dependency tree is refreshed. `2.21.0` is the version already resolved in `node_modules`, so this adds no new code to the bundle.

- [ ] **Step 2: Install**

Run: `npm install`
Expected: `package-lock.json` records `livekit-client` as a root dependency; no version changes elsewhere.

- [ ] **Step 3: Create `services/livekitToken.ts`**

```ts
import { TokenSource } from "livekit-client"

import { env } from "@/constants/env"

// Requests tokens from the LiveKit Cloud token server:
// POST https://cloud-api.livekit.io/api/v2/sandbox/connection-details
const tokenSource = TokenSource.sandboxTokenServer(env.sandboxId)

// LiveKit disconnects the existing participant when someone joins with the
// same identity, so a random suffix keeps same-named participants apart.
// The name other participants see is passed separately as participantName.
const createIdentity = (participantName: string): string =>
  `${participantName}-${Math.random().toString(36).slice(2, 8)}`

export const fetchParticipantToken = async (
  participantName: string,
): Promise<string> => {
  const response = await tokenSource.fetch({
    roomName: env.roomName,
    participantName,
    participantIdentity: createIdentity(participantName),
  })

  return response.participantToken
}
```

The `serverUrl` field of the response is deliberately ignored — the app connects to `env.serverUrl`.

- [ ] **Step 4: Verify types and lint**

Run: `npm run type-check`
Expected: no output, exit code 0. In particular `response.participantToken` must type-check as `string` — if it does not, the installed `livekit-client` is not 2.21.0.

Run: `npm run lint`
Expected: no errors, and no warning or error in `services/livekitToken.ts`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json services/livekitToken.ts
git commit -m "feat(token): added access token fetching from LiveKit token server"
```

---

### Task 3: Join screen

**Files:**

- Create: `screens/JoinScreen.tsx`
- Modify: `constants/colors.ts`

**Interfaces:**

- Consumes: `configError` from `@/constants/env` (Task 1), `fetchParticipantToken` from `@/services/livekitToken` (Task 2), `BACKGROUND_COLORS` / `BORDER_COLORS` / `TEXT_COLORS` from `@/constants/colors`.
- Produces: `JoinScreen` component with props `{ error?: string; onJoined: (token: string) => void }`.

- [ ] **Step 1: Add the placeholder color to `constants/colors.ts`**

Add one key to the existing `TEXT_COLORS` object, so the placeholder color is not a literal in the component:

```ts
export const TEXT_COLORS = {
  light: "#FFFFFF",
  secondary: "#333",
  danger: "#FF3B30",
  placeholder: "#999999",
}
```

- [ ] **Step 2: Create `screens/JoinScreen.tsx`**

The styles are the login-screen styles moved out of `App.tsx`, renamed for this
screen (`connectContainer` → `content`, `connectButton*` → `joinButton*`).

```tsx
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

import { StatusBar } from "expo-status-bar"

import {
  BACKGROUND_COLORS,
  BORDER_COLORS,
  TEXT_COLORS,
} from "@/constants/colors"
import { configError } from "@/constants/env"
import { fetchParticipantToken } from "@/services/livekitToken"

interface JoinScreenProps {
  // Error from a previous room connection attempt, shown on return
  error?: string
  onJoined: (token: string) => void
}

// Login screen: the participant enters a name, the token is requested for them
export const JoinScreen = ({ error, onJoined }: JoinScreenProps) => {
  const [name, setName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const join = useCallback(async (): Promise<void> => {
    const participantName = name.trim()

    if (!participantName) {
      setTokenError("Please enter your name")
      return
    }

    setIsLoading(true)
    setTokenError(null)

    try {
      const token = await fetchParticipantToken(participantName)
      onJoined(token)
    } catch (cause) {
      console.error("Failed to get an access token: ", cause)
      setTokenError(
        cause instanceof Error
          ? cause.message
          : "Failed to get an access token",
      )
    } finally {
      setIsLoading(false)
    }
  }, [name, onJoined])

  const message = configError ?? tokenError ?? error
  const isDisabled = isLoading || configError !== null

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Native Meet</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={TEXT_COLORS.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isDisabled}
            returnKeyType="go"
            onSubmitEditing={join}
            accessibilityLabel="Participant name"
          />
        </View>

        {message && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{message}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.joinButton, isDisabled && styles.joinButtonDisabled]}
          onPress={join}
          disabled={isDisabled}
          accessibilityLabel="Join room"
        >
          {isLoading ? (
            <ActivityIndicator color={TEXT_COLORS.light} />
          ) : (
            <Text style={styles.joinButtonText}>Join</Text>
          )}
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: TEXT_COLORS.light,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: TEXT_COLORS.light,
  },
  input: {
    backgroundColor: TEXT_COLORS.light,
    borderWidth: 1,
    borderColor: BORDER_COLORS.lightBorder,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: TEXT_COLORS.secondary,
    minHeight: 50,
  },
  errorContainer: {
    backgroundColor: BACKGROUND_COLORS.tertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: BORDER_COLORS.danger,
  },
  errorText: {
    color: TEXT_COLORS.danger,
    fontSize: 14,
    fontWeight: "500",
  },
  joinButton: {
    backgroundColor: BACKGROUND_COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    minHeight: 56,
    justifyContent: "center",
  },
  joinButtonDisabled: {
    backgroundColor: BACKGROUND_COLORS.disabled,
  },
  joinButtonText: {
    color: TEXT_COLORS.light,
    fontSize: 18,
    fontWeight: "600",
  },
})
```

`minHeight` and `justifyContent` on `joinButton` keep the button from resizing when the label is swapped for the spinner.

- [ ] **Step 3: Verify types and lint**

Run: `npm run type-check`
Expected: no output, exit code 0.

Run: `npm run lint`
Expected: no errors, and no warning or error in `screens/JoinScreen.tsx` or `constants/colors.ts`. If `react-native/no-unused-styles` fires, a style key was copied over without a user — delete it.

- [ ] **Step 4: Commit**

```bash
git add screens/JoinScreen.tsx constants/colors.ts
git commit -m "feat(screens): added join screen with participant name input"
```

---

### Task 4: Wire the app to the join screen

**Files:**

- Modify: `types/index.ts:3-12`
- Modify: `App.tsx` (whole file — the login UI and its styles leave for `screens/JoinScreen.tsx`)

**Interfaces:**

- Consumes: `JoinScreen` (Task 3), `env` (Task 1), `ActiveRoom` from `@/components/room/ActiveRoom`.
- Produces: the app's runtime behavior — nothing imports `App.tsx` except `index.js`.

- [ ] **Step 1: Reshape the types in `types/index.ts`**

Replace the `AppConfig` and `ConnectionState` declarations (lines 3-12) with a single
interface. `AppConfig` goes away because the user no longer types a URL or a
token. Leave `VideoControlsState` untouched — `components/room/ControlBar.tsx`
uses it.

```ts
// Types for the LiveKit React Native application

export interface ConnectionState {
  // Access token of the current session; null means "not in a room"
  token: string | null
  error?: string
}

export interface VideoControlsState {
  isMuted: boolean
  isVideoEnabled: boolean
  isSpeaking: boolean
}
```

- [ ] **Step 2: Rewrite `App.tsx`**

Full new contents. The `Alert` popups are gone: every error now shows inside the
join screen.

```tsx
import { useCallback, useEffect, useState } from "react"
import { LogBox } from "react-native"

import { LiveKitRoom } from "@livekit/react-native"

import { ActiveRoom } from "@/components/room/ActiveRoom"
import { env } from "@/constants/env"
import { JoinScreen } from "@/screens/JoinScreen"

import type { ConnectionState } from "@/types"

const initialConnectionState: ConnectionState = {
  token: null,
}

// Main application component
export default () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    () => initialConnectionState,
  )

  // Suppress non-critical warnings
  useEffect(() => {
    LogBox.ignoreLogs([
      "An event listener wasn't added because it has been added already",
      "Warning: WebRTC",
    ])
  }, [])

  const onJoined = useCallback((token: string): void => {
    setConnectionState({ token })
  }, [])

  const onDisconnect = useCallback((): void => {
    setConnectionState({ token: null })
  }, [])

  const onConnectionError = useCallback((error?: Error): void => {
    console.error("Connection error: ", error)
    setConnectionState({
      token: null,
      error: error?.message || "Failed to connect to the room",
    })
  }, [])

  if (connectionState.token === null) {
    return <JoinScreen error={connectionState.error} onJoined={onJoined} />
  }

  return (
    <LiveKitRoom
      serverUrl={env.serverUrl}
      token={connectionState.token}
      connect
      onDisconnected={onDisconnect}
      onError={onConnectionError}
      options={{}}
    >
      <ActiveRoom />
    </LiveKitRoom>
  )
}
```

- [ ] **Step 3: Verify types and lint**

Run: `npm run type-check`
Expected: no output, exit code 0. A complaint about `AppConfig` means a leftover reference survived.

Run: `npm run lint`
Expected: no errors. `App.tsx` must have no unused-import errors — `Alert`, `SafeAreaView`, `StyleSheet`, `Text`, `TextInput`, `TouchableOpacity`, `View` and the color constants are no longer used there.

- [ ] **Step 4: Manual verification in the app**

Run: `npm run android` (or `npm run ios` on macOS)

Check, in order:

1. The login screen shows one field, "Your name", and a "Join" button.
2. Pressing "Join" with an empty field shows "Please enter your name" and does not start a request.
3. Entering a name and pressing "Join" shows the spinner, then the room screen appears — this proves the token server answered and the connection to `env.serverUrl` succeeded.
4. Leaving the room returns to the login screen.
5. Join from a second device or emulator under the _same_ name: both participants stay in the room (this is what the random identity suffix buys).

If step 3 fails with an error message from the token server, the message is
shown verbatim on the login screen — report it rather than guessing.

- [ ] **Step 5: Commit**

```bash
git add App.tsx types/index.ts
git commit -m "feat(auth): replaced url and token inputs with participant name"
```

---

### Task 5: Update the README

**Files:**

- Modify: `README.md:24-37` (setup), `README.md:69-74` (usage), `README.md:102-118` (project structure), `README.md:129-142` (types and screens), `README.md:216-224` (support)

**Interfaces:**

- Consumes: the finished behavior from Tasks 1-4.
- Produces: documentation only.

- [ ] **Step 1: Replace setup sections 2 and 3 (lines 24-37)**

````markdown
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
````

- [ ] **Step 2: Replace the Usage section (lines 69-74)**

```markdown
## Usage

1. Start the app
2. Enter your name
3. Press "Join" — the app requests an access token and joins the room from
   `EXPO_PUBLIC_LIVEKIT_ROOM`

Participants with the same name do not clash: the display name is what you
typed, while the LiveKit identity gets a random suffix.
```

- [ ] **Step 3: Update the project structure block (lines 104-118)**

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

- [ ] **Step 4: Fix the type list (lines 129-134) and the connection screen list (lines 138-142)**

The old list named `AppConfig` and `ParticipantInfo`; neither exists now
(`ParticipantInfo` never did). Replace the "Core types" list with:

```markdown
### Core types:

- `ConnectionState` - session state: access token and last error
- `VideoControlsState` - controls state
```

Replace the "Connection screen" list with:

```markdown
### Login screen

- Participant name input
- Access token requested from the LiveKit Cloud token server
- Environment configuration and connection errors shown inline
```

- [ ] **Step 5: Fix the support checklist (lines 220-224)**

```markdown
1. Verify you are using a Development Build, not Expo Go
2. Make sure all dependencies are installed correctly
3. Check that `.env.local` exists and all three variables are filled in
4. Check that the token server is enabled in the LiveKit Cloud project settings
5. Consult the LiveKit documentation
```

- [ ] **Step 6: Verify**

Run: `npm run format:check`
Expected: `README.md` passes (Prettier formats Markdown too).

Run: `npm run lint`
Expected: unchanged from Task 4.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs(readme): documented env based setup and name login"
```

---

## Notes for the implementer

- **The token server contract** was verified against the installed `livekit-client@2.21.0`, not against documentation: `TokenSource.sandboxTokenServer(id)` posts to `https://cloud-api.livekit.io/api/v2/sandbox/connection-details` with an `X-Sandbox-ID` header and a `{room_name, participant_name}` body, and parses the answer into an object with `serverUrl` and `participantToken`. If a runtime error contradicts this, read `node_modules/livekit-client/dist/src/room/token-source/` before changing anything.
- **This is a dev-only auth path.** LiveKit's own docs call the token server unsuitable for production. Do not ship it to real users; a production build needs an endpoint of your own that signs tokens with the API secret server-side.
- Task 4 is the first point where the app can actually run end-to-end. Tasks 1-3 only compile.
