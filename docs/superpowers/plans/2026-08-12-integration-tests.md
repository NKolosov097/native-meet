# Integration Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JavaScript-level integration tests for application room transitions, control-bar actions, and media-device discovery and selection.

**Architecture:** React Native Testing Library renders real project component trees. Tests replace only token acquisition, LiveKit providers/hooks, native alerts, and `navigator.mediaDevices`; media-device integration is implemented only after App and ControlBar coverage is green.

**Tech Stack:** Expo SDK 57, React 19, React Native 0.86, TypeScript 6, Jest 29, `jest-expo`, React Native Testing Library 14, LiveKit React Native 2.12.

## Global Constraints

- Preserve all existing unit and component tests.
- Test through accessibility labels, visible text, and public callbacks; do not assert exact styles, SVG internals, private state, or component hierarchy.
- Mock only external/system boundaries and mirror the relevant real boundary shape.
- Do not claim to validate native permissions, hardware, WebRTC publication, or audio routing.
- Make no production change unless a focused integration test first demonstrates a real defect.
- Implement media-device discovery and selection only after App and ControlBar integration tasks are complete.
- Leave the pre-existing `eas.json` formatting discrepancy unchanged and report it separately.

---

## File Map

- Create `App.integration.test.tsx`: real App/JoinScreen state transitions across a controlled LiveKit boundary.
- Create `components/room/ControlBar.integration.test.tsx`: real control bar and child controls with controlled LiveKit hooks.
- Create `components/room/controls/mediaDevices.integration.test.tsx`: real microphone/camera discovery, refresh, dropdown, and selection flows.
- Modify production files only if a failing integration test exposes a genuine behavior defect.

---

### Task 1: Application Room Transitions

**Files:**
- Create: `App.integration.test.tsx`
- Test: `App.tsx`, `screens/JoinScreen.tsx`

**Interfaces:**
- Consumes: default `App`, `fetchParticipantToken(name): Promise<string>`, `LiveKitRoom` props, and configured `env`.
- Produces: integration coverage for join, room presentation, disconnect, connection errors, fallback errors, and recovery.

- [ ] **Step 1: Create the external-boundary doubles**

Mock token acquisition with a Jest function. Mock `@/constants/env` with complete values:

```ts
{
  env: {
    serverUrl: "wss://integration.livekit.cloud",
    sandboxId: "integration-sandbox",
    roomName: "integration-room",
  },
  configError: null,
}
```

Mock `@/components/room/ActiveRoom` as a visible `Text` marker because this task tests App transitions, not the room subtree. Implement `LiveKitRoom` as a boundary component that renders children plus accessible buttons whose handlers invoke its received `onDisconnected` and `onError` props. Capture the latest complete props in a typed variable for boundary-contract assertions.

- [ ] **Step 2: Add join and LiveKit configuration tests**

Render real `App`, assert `Participant name` and `Join room` are visible, enter `  Ada  `, and press Join. Resolve the token service with `token-abc`. Assert the visible active-room marker and these literal boundary values:

```ts
expect(latestLiveKitProps).toMatchObject({
  serverUrl: "wss://integration.livekit.cloud",
  token: "token-abc",
  connect: true,
  connectOptions: { maxRetries: 5 },
  options: {
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: { simulcast: false },
  },
})
```

Assert `fetchParticipantToken` received `Ada`. Do not assert mocked child internals.

- [ ] **Step 3: Run and establish characterization RED where possible**

Run: `pnpm.cmd test App.integration.test.tsx`

Expected: PASS if current join behavior is correct. Mutation-check by temporarily changing `onJoined` in `App.tsx` to keep `token: null`; rerun and expect the active-room assertion to FAIL. Restore immediately.

- [ ] **Step 4: Add disconnect and error transition tests**

After joining, press the boundary's disconnect trigger and assert the join screen returns without an error. In separate tests invoke `onError(new Error("room unavailable"))` and `onError(undefined)` through accessible triggers. Assert the join screen returns with `room unavailable` and `Failed to connect to the room`, respectively. Spy on `console.error` only in error cases and restore it.

- [ ] **Step 5: Add recovery test**

Cause `room unavailable`, then enter a name and join again with a successful token. Assert the active-room marker returns and `room unavailable` is no longer visible. This proves the next successful session clears the prior connection error.

- [ ] **Step 6: Verify Task 1**

Run: `pnpm.cmd test App.integration.test.tsx screens/JoinScreen.test.tsx`

Expected: all App integration and existing JoinScreen tests PASS.

Run: `pnpm.cmd exec eslint App.integration.test.tsx`

Expected: PASS with zero errors.

- [ ] **Step 7: Commit**

```powershell
git add App.integration.test.tsx App.tsx
git commit -m "test: cover application room transitions"
```

Only add `App.tsx` if Task 1 required a tested production fix.

---

### Task 2: Control Bar Actions

**Files:**
- Create: `components/room/ControlBar.integration.test.tsx`
- Test: `components/room/ControlBar.tsx`, `components/room/controls/MicrophoneControl.tsx`, `components/room/controls/CameraControl.tsx`

**Interfaces:**
- Consumes: real `ControlBar`; mocked `useRoomContext()` and `useLocalParticipant()` returning a room and local-participant boundary.
- Produces: integration coverage for toggles, pending guards, alerts, disconnect, and dropdown coordination.

- [ ] **Step 1: Build complete controllable LiveKit boundaries**

Mock only `useRoomContext` and `useLocalParticipant` from `@livekit/react-native`. Preserve any module exports required by the real controls. The local-participant fixture must include `setMicrophoneEnabled` and `setCameraEnabled`; the room fixture must include `disconnect`, `getActiveDevice`, `switchActiveDevice`, `on`, and `off`. Set `navigator.mediaDevices.enumerateDevices` to resolve `[]` for this task.

- [ ] **Step 2: Test microphone and camera direction**

With `isMicrophoneEnabled: true` and `isCameraEnabled: false`, render `ControlBar`. Press `Mute microphone` and `Turn on camera`. Assert:

```ts
expect(setMicrophoneEnabled).toHaveBeenCalledWith(false)
expect(setCameraEnabled).toHaveBeenCalledWith(true)
```

Rerender with inverse states and assert the inverse arguments. These assertions catch stale or reversed state mapping.

- [ ] **Step 3: Mutation-check toggle direction**

Temporarily change the microphone call to `setMicrophoneEnabled(isMicrophoneEnabled)`. Run:

`pnpm.cmd test components/room/ControlBar.integration.test.tsx -t "microphone"`

Expected: FAIL with the wrong boolean. Restore immediately and rerun to PASS.

- [ ] **Step 4: Test concurrent-toggle guards**

Use deferred promises for `setMicrophoneEnabled` and `setCameraEnabled`. Invoke the same accessible control twice inside one `act` before resolving. Assert each LiveKit method is called exactly once, resolve the promise, and await both actions.

- [ ] **Step 5: Test toggle failure feedback**

Reject microphone and camera methods independently. Spy on `Alert.alert` and `console.error`. Assert literal alerts:

```ts
expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to toggle microphone")
expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to toggle camera")
```

Restore all spies after each test.

- [ ] **Step 6: Test disconnect success and failure stability**

Press `Disconnect from room` and assert `room.disconnect()` is invoked once. In a separate case reject it with `new Error("disconnect failed")`, assert the rendered controls remain on screen, and assert the existing diagnostic `console.error("Error disconnecting: ", error)`.

- [ ] **Step 7: Test dropdown coordination**

Press `Select audio device`, assert `Close device list` and the audio empty state appear. Then press `Select camera`; assert the audio overlay disappears and `Close camera list`/camera empty state appear. Press the camera overlay and assert it closes. This exercises the real parent/child dropdown state.

- [ ] **Step 8: Verify Task 2**

Run: `pnpm.cmd test components/room/ControlBar.integration.test.tsx`

Expected: all toggle, guard, error, disconnect, and dropdown tests PASS.

Run: `pnpm.cmd exec eslint components/room/ControlBar.integration.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add components/room/ControlBar.integration.test.tsx components/room/ControlBar.tsx
git commit -m "test: cover integrated room controls"
```

Only add `ControlBar.tsx` if Task 2 required a tested production fix.

---

### Task 3: Media Device Discovery and Selection

**Files:**
- Create: `components/room/controls/mediaDevices.integration.test.tsx`
- Test: `components/room/controls/MicrophoneControl.tsx`, `components/room/controls/CameraControl.tsx`, `components/room/controls/useActiveMediaDevice.ts`

**Interfaces:**
- Consumes: real `MicrophoneControl` and `CameraControl`; controlled `navigator.mediaDevices`; a LiveKit room with active-device state and event subscription.
- Produces: final integration coverage for enumeration, filtering, fallback labels, initialization, switching, refresh, cleanup, and errors.

- [ ] **Step 1: Create complete device and room fixtures**

Define literal full `MediaDeviceInfo`-shaped fixtures:

```ts
const devices = [
  { deviceId: "mic-1", groupId: "audio", kind: "audioinput", label: "Desk microphone", toJSON: jest.fn() },
  { deviceId: "speaker-1", groupId: "audio", kind: "audiooutput", label: "Desk speakers", toJSON: jest.fn() },
  { deviceId: "camera-1", groupId: "video", kind: "videoinput", label: "Front camera", toJSON: jest.fn() },
]
```

Install `navigator.mediaDevices` with `enumerateDevices`, `addEventListener`, and `removeEventListener`. Mock `useRoomContext` to return a room fixture with `getActiveDevice`, `switchActiveDevice`, `on`, and `off`. Capture `RoomEvent.MediaDevicesChanged` callbacks in a map so tests can trigger refresh through the same subscription used by production.

- [ ] **Step 2: Test discovery, filtering, and empty states**

Render real `MicrophoneControl` with its dropdown visible. Await `Desk microphone` and `Desk speakers`; assert `Front camera` is absent. Render real `CameraControl` and assert the inverse filtering. With `enumerateDevices` resolving `[]`, assert `No audio devices found` and `No cameras found`.

- [ ] **Step 3: Test fallback labels**

Return empty labels with literal ids `microphone-abcdef123`, `speaker-abcdef123`, and `camera-abcdef123`. Assert visible labels use the existing first-eight-character forms:

```text
Microphone micropho
Speaker speaker-
Camera camera-a
```

For the combined audio list, include and assert the existing `(Input)` / `(Output)` suffixes.

- [ ] **Step 4: Test initialization and active-device preservation**

When `getActiveDevice("audioinput")` and `getActiveDevice("videoinput")` return missing ids, await effects and assert the first matching devices are selected using `switchActiveDevice("audioinput", "mic-1")` and `switchActiveDevice("videoinput", "camera-1")`. When active ids already match available devices, assert no initialization switch occurs.

- [ ] **Step 5: Mutation-check first-device initialization**

Temporarily change `fallbackDevice` in `useActiveMediaDevice.ts` from index `0` to index `1`. Run the initialization tests and expect failure. Restore immediately and rerun to PASS.

- [ ] **Step 6: Test input, output, and camera selection**

With dropdowns visible, press `Desk microphone`, `Desk speakers`, and `Front camera` in separate renders. Assert literal calls:

```ts
expect(switchActiveDevice).toHaveBeenCalledWith("audioinput", "mic-1")
expect(switchActiveDevice).toHaveBeenCalledWith("audiooutput", "speaker-1")
expect(switchActiveDevice).toHaveBeenCalledWith("videoinput", "camera-1")
```

Assert each supplied `onCloseDropdown` callback is called after successful selection.

- [ ] **Step 7: Test selection failures**

Reject `switchActiveDevice` separately for audio and video. Assert the current alerts `Failed to switch audio device` and `Failed to switch camera`; assert `onCloseDropdown` is not called, proving the list remains open for retry.

- [ ] **Step 8: Test refresh and cleanup**

Start with `Desk microphone`, then change the enumerate result to a complete `USB microphone` fixture and invoke the captured `RoomEvent.MediaDevicesChanged` callback. Await the new label and assert the old label disappears. Unmount and assert `room.off(RoomEvent.MediaDevicesChanged, sameCallback)` receives the identical callback registered by `room.on`.

- [ ] **Step 9: Verify Task 3**

Run: `pnpm.cmd test components/room/controls/mediaDevices.integration.test.tsx components/room/controls/useActiveMediaDevice.test.ts`

Expected: all media-device integration and existing helper unit tests PASS.

Run: `pnpm.cmd exec eslint components/room/controls/mediaDevices.integration.test.tsx`

Expected: PASS.

- [ ] **Step 10: Commit**

```powershell
git add components/room/controls/mediaDevices.integration.test.tsx components/room/controls/useActiveMediaDevice.ts components/room/controls/MicrophoneControl.tsx components/room/controls/CameraControl.tsx
git commit -m "test: cover media device integration"
```

Only add production files that required tested fixes.

---

### Task 4: Full Verification

**Files:**
- Verify all changed test and production files.

**Interfaces:**
- Consumes: Tasks 1–3 and all existing tests.
- Produces: a verified JavaScript integration baseline ready for Maestro E2E planning.

- [ ] **Step 1: Run all Jest tests**

Run: `pnpm.cmd test`

Expected: all unit, component, and integration suites PASS with zero failures.

- [ ] **Step 2: Run retained Node tests**

Run: `pnpm.cmd test:node`

Expected: 5 tests PASS.

- [ ] **Step 3: Run static verification**

Run: `pnpm.cmd type-check`

Expected: PASS.

Run: `pnpm.cmd lint`

Expected: PASS with zero errors.

- [ ] **Step 4: Run formatting and diff checks**

Run: `pnpm.cmd format:check`

Expected: the known pre-existing `eas.json` discrepancy may remain; no new or changed file may be reported.

Run: `git diff --check 9050e61..HEAD`

Expected: no whitespace errors.

- [ ] **Step 5: Audit design coverage**

Map every Application Integration, Control Bar Integration, and Media Device Integration requirement in `docs/superpowers/specs/2026-08-12-integration-tests-design.md` to a named passing test. Confirm no test claims native permissions, real hardware, or WebRTC coverage.
