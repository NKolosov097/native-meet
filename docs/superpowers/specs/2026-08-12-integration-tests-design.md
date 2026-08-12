# Integration Tests Design

## Goal

Add a focused JavaScript-level integration test suite for application navigation, room controls, and media-device selection before moving to device-level Maestro end-to-end tests.

## Scope and Order

Implementation proceeds in three ordered blocks:

1. Application join, room, disconnect, and connection-error transitions.
2. Control bar microphone, camera, and disconnect interactions.
3. Media-device discovery, rendering, refresh, and selection through `navigator.mediaDevices`.

The media-device block is intentionally last. Existing unit and component tests remain unchanged and continue to run in the complete Jest suite.

## Test Boundary

Tests render real project components and exercise them through accessible labels, visible text, and events. Only system and external boundaries are replaced:

- LiveKit React Native providers and hooks;
- LiveKit room and local-participant objects;
- token acquisition;
- `navigator.mediaDevices.enumerateDevices`;
- native alerts where their invocation is the user-visible failure outcome.

Mocks must preserve the relevant shape and callbacks of the real boundary. Tests will not assert SVG internals, exact styles, private React state, or component hierarchy.

## Application Integration

Create `App.integration.test.tsx` around the real default `App` component and real `JoinScreen`. Replace only token acquisition, `ActiveRoom`, and the external `LiveKitRoom` boundary.

Verify that the application:

- starts on the join screen;
- requests a token using the trimmed participant name;
- passes the configured server URL and returned token to `LiveKitRoom`;
- enables connection and preserves the current room/connect options contract;
- shows the active-room surface after a successful join;
- returns to the join screen after `onDisconnected`;
- returns to the join screen with the LiveKit error message after `onError(error)`;
- uses `Failed to connect to the room` when `onError` receives no `Error`;
- clears an earlier connection error after a later successful join.

The `LiveKitRoom` replacement must render its children and expose its callbacks through an accessible test surface, so state transitions are tested through the real `App` callbacks rather than by calling internal functions.

## Control Bar Integration

Create `ControlBar.integration.test.tsx` around the real `ControlBar`, `MicrophoneControl`, and `CameraControl`. LiveKit hooks return a controllable room and local participant. `navigator.mediaDevices` may return an empty list in this block so device menus do not distract from toggle behavior.

Verify that the control bar:

- requests the inverse of the current microphone state;
- requests the inverse of the current camera state;
- ignores a second microphone toggle while the first is pending;
- ignores a second camera toggle while the first is pending;
- reports microphone and camera failures using the current alert messages;
- invokes room disconnect;
- preserves stability and reports the existing diagnostic when disconnect rejects;
- opens only one device dropdown at a time and closes it through its overlay.

Assertions focus on project behavior at the LiveKit boundary. They do not test LiveKit hook mechanics.

## Media Device Integration

Implement this block after the application and control-bar blocks. Use the real `MicrophoneControl`, `CameraControl`, device-loading effects, active-device synchronization helpers, and dropdown rendering.

Provide a controlled `navigator.mediaDevices` boundary whose `enumerateDevices()` returns complete device objects with at least `deviceId`, `groupId`, `kind`, and `label`, plus inert event-listener methods when required by the platform shape.

Verify that the controls:

- display enumerated microphones, speakers, and cameras with their supplied labels;
- filter unrelated device kinds from each list;
- generate the existing fallback labels when labels are empty;
- initialize a missing active input or camera to the first available device;
- preserve an active device that still exists;
- switch microphone input using `audioinput`;
- switch speaker output using `audiooutput`;
- switch camera using `videoinput`;
- close the corresponding dropdown after successful selection;
- keep the dropdown open and show the existing alert when switching fails;
- reload the visible device list after LiveKit's `MediaDevicesChanged` event;
- unsubscribe the same refresh callback on unmount;
- render the existing empty-list messages when no matching devices exist.

These tests validate JavaScript discovery and selection flow only. They do not claim to validate actual hardware enumeration, operating-system permissions, native WebRTC publication, or audio routing.

## Error Handling

Expected failures must retain current user-visible behavior:

- connection errors return the user to the join screen;
- toggle and device-switch failures call `Alert.alert` with their current messages;
- enumeration and disconnect failures are logged and do not crash the rendered component.

Console output is suppressed only within the test that deliberately exercises an error path, and the spy is restored afterward.

## Implementation Method

Use test-driven development for any production change:

1. Write one behavior-focused integration test.
2. Run it and confirm the expected failure.
3. Make the smallest required production change.
4. Run the focused test and then the complete suite.
5. Refactor only while tests remain green.

For characterization tests of already-working behavior, perform a targeted mutation check where practical: temporarily break the relevant branch or argument, confirm the test fails, restore the code, and rerun successfully.

## Verification

Completion requires fresh successful runs of:

- all Jest unit, component, and integration tests;
- the retained Node geometry suite;
- TypeScript type checking;
- ESLint.

Formatting verification will also run. The pre-existing `eas.json` formatting discrepancy is outside this test scope and must be reported separately unless the user explicitly authorizes changing it.

## Handoff to Maestro

The following remain for end-to-end coverage on an Android emulator, iOS simulator, or physical device:

- camera and microphone permission prompts;
- real LiveKit connection and media publication;
- actual hardware device availability and routing;
- remote participant visibility and multi-participant behavior;
- application behavior across native lifecycle events and network interruption.
