# Wear OS shell

This target is a native Kotlin/Compose watch app that consumes the shared
navigation core through a lightweight bridge.

## Responsibilities

- Read step count and rotation vector data from `SensorManager`
- Mark the current location as an anchor point
- Render the center distance, edge arrow, and confidence ring
- Keep everything offline and on-device

