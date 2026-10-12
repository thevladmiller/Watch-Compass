# Watch Compass

Watch Compass is a mobile-first proof of concept for marking an offline local origin and finding your way back. It runs in Safari on iPhone and Chrome on Android, stores no movement history, and sends no sensor data to a server.

## Experience

- The first visit opens a three-step tutorial.
- Tap **Set** to zero the local coordinate system and grant motion access.
- The button becomes an organic white compass form.
- By one metre, the form reaches the edge pointing back to the saved origin, then gradually compresses into a smaller bump as distance increases.
- Draw three continuous counterclockwise circles with one finger to reset.

The visual language uses original, code-drawn organic forms inspired by tactile physics games. No external artwork or game assets are included.

## Mobile sensors

The POC uses only web sensor APIs available on both current mobile platforms:

- Device motion for acceleration, gyroscope rates, step detection, and organic deformation
- Device orientation as the browser's OS-fused accelerometer/gyroscope/magnetometer result
- Pedestrian dead reckoning for local distance and bearing
- Stationary detection and zero-velocity correction to limit drift

GPS and the browser geolocation API are never used. Mobile browsers require HTTPS for motion sensors. iOS asks for permission only after a user gesture, so permission is requested from the **Set** button.

Browser sensor sampling rates are controlled by the operating system and are usually lower than native 100–200 Hz access. The modular navigation core in `src/navigation/` is designed so the same algorithms can later receive higher-rate samples from the native watch applications. As with all unaided PDR, step length and magnetic interference can introduce drift.

## Run locally

```sh
npm install
npm run dev -- --host
```

Local desktop testing works at `http://localhost:5173`, but physical phones need an HTTPS deployment to expose compass and motion reliably.

## Build

```sh
npm run build
npm run preview -- --host
```

The production output is written to `dist/`. The bundled web manifest and service worker make it installable and offline-ready after the first successful load.

## Native prototypes

Earlier watchOS and Wear OS experiments remain in `native/`. The web POC in `src/` is the current testable product surface.
