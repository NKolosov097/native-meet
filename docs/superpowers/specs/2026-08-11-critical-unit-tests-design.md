# Critical Unit Tests Design

## Goal

Add a small, high-value unit and component test suite that protects the application's critical join flow before end-to-end tests are introduced.

## Scope

The suite will cover four areas:

1. Device identity persistence and reuse.
2. LiveKit participant-token acquisition.
3. Join screen validation, progress, success, and failure behavior.
4. Active media-device initialization and event subscription behavior.

The existing dropdown-layout tests remain in place. Presentational snapshots, style assertions, icon tests, and broad coverage targets are out of scope because they would add maintenance cost without protecting important behavior.

## Test Infrastructure

Use Jest with the React Native preset and React Native Testing Library for component behavior. Add a single `test` package script that runs all unit tests non-interactively. Configuration and dependency versions must be compatible with the project's current React 19, React Native 0.86, Expo 57, TypeScript, and pnpm setup.

Tests will exercise public behavior. External boundaries such as AsyncStorage, the LiveKit token source, and native media APIs may be mocked. Internal component state, styles, and implementation-only call sequences will not be asserted unless they represent an externally required contract.

## Device Identity Tests

Verify that `getDeviceIdentity`:

- returns a stored identity without generating or writing a replacement;
- generates a valid non-empty device identity when storage is empty;
- persists a newly generated identity;
- reuses the in-memory identity without reading storage repeatedly;
- still returns a generated identity when reading or writing AsyncStorage fails.

The module needs a test-safe way to reset its in-memory cache between cases. This must not become part of the application's public API; module isolation or a narrowly scoped test seam is preferred.

## Token Service Tests

Verify that `fetchParticipantToken`:

- obtains the stable device identity and sends the configured room name, display name, and participant identity to the LiveKit token source;
- enables the token-source refresh flag expected by the current implementation;
- returns a non-empty participant token;
- rejects an empty token with the existing explicit error;
- propagates token-server failures without replacing their diagnostic information.

## Join Screen Tests

Exercise the screen through visible text, accessibility labels, and user events. Verify that it:

- rejects an empty or whitespace-only participant name without calling the token service;
- trims the participant name before requesting a token;
- disables the interactive controls and shows progress while joining;
- prevents duplicate token requests while the first request is pending;
- calls `onJoined` exactly once with the returned token;
- renders an `Error` message from a failed token request;
- renders the generic fallback for a non-`Error` rejection;
- shows an incoming connection error initially and replaces it with the current join attempt's error;
- respects invalid environment configuration by disabling joining and displaying the configuration error.

Tests will not assert exact style objects or component hierarchy.

## Active Media Device Tests

Verify the exported non-React behavior in `useActiveMediaDevice.ts`:

- a valid active camera or microphone is retained;
- the first available device is selected when the active device is missing or stale;
- no switch occurs when no devices are available;
- camera and microphone map to the correct native device kinds;
- media-device change subscription registers the callback and its cleanup unregisters the same callback.

Hook rendering itself is excluded unless these behavioral tests expose a gap that cannot be covered through the exported functions without testing React lifecycle behavior.

## Implementation Method

Use test-driven development for any required production-code change:

1. Add one behavior-focused test.
2. Run it and confirm it fails for the intended reason.
3. Make the smallest production or configuration change needed.
4. Run the focused test, then the complete unit suite.
5. Refactor only while the suite remains green.

Existing behavior that already works may naturally make characterization tests pass immediately. For those cases, mutation verification will be used where practical: temporarily alter or disable the relevant behavior, confirm the test fails, restore it, and rerun it successfully.

## Verification

Completion requires fresh successful runs of:

- the complete unit test command;
- TypeScript type checking;
- ESLint;
- formatting verification.

Any failures introduced by the test infrastructure or test-related production changes are part of this work. Unrelated pre-existing failures will be reported with evidence and kept separate.

## Handoff to E2E

The later end-to-end phase should focus on native integration that unit tests intentionally cannot prove: permissions, real LiveKit connection and disconnection, device switching on hardware or emulators, and cross-participant room behavior.
