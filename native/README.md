# Watch Navigation App

This folder contains the native-first architecture for the smartwatch app:

- `shared/` holds the offline navigation core
- `watch-ui/` holds the minimal Bauhaus-inspired UI model
- `platform/` is where watchOS and Wear OS sensor adapters plug in

The app is designed to work fully offline and uses only on-device sensors.
It marks a starting point, then estimates return direction and distance from
steps plus orientation drift.

## Build plan

1. Shared navigation math and session state
2. Wearable UI state model
3. watchOS sensor adapter
4. Wear OS sensor adapter
5. Native app shells and permissions

