# Platform adapters

Add watch-specific sensor adapters here:

- `watchos/` for Core Motion and HealthKit-compatible sensor access
- `wearos/` for `SensorManager` and step counter access

Each adapter should emit the same `NavigationSample` shape so the shared
navigation core stays identical across platforms.

## Current scaffold

- `watchos/Package.swift` provides a Swift Package entry point for the shared
  watch logic
- `watchos/WatchNavigation.xcodeproj/` is the native iOS/watchOS project shell
- `wearos/settings.gradle.kts` and `wearos/app/build.gradle.kts` provide the
  Android project wrapper

