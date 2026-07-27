# watchOS shell

This target is a native SwiftUI watch app that consumes the shared navigation
core through a lightweight bridge.

## Responsibilities

- Read pedometer and motion heading data from `CoreMotion`
- Mark the current location as an anchor point
- Render the center distance, edge arrow, and confidence ring
- Keep all state on-device with no network dependency

