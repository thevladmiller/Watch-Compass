# Watch Compass

Watch Compass is a mobile-first proof of concept for marking a location and finding your way back. It runs in Safari on iPhone and Chrome on Android, stores no location history, and sends no sensor data to a server.

## Experience

- The first visit opens a three-step tutorial.
- Tap **Set** to save the current GPS position and grant motion access.
- The button becomes a living white compass creature.
- As distance increases, the creature travels toward the edge pointing back to the saved origin and compresses into a smaller bump.
- Draw three continuous counterclockwise circles with one finger to reset.

The visual language uses original, code-drawn organic forms inspired by tactile physics games. No external artwork or game assets are included.

## Mobile sensors

The POC uses the web platform APIs available on both current mobile platforms:

- Geolocation for distance and bearing to the saved point
- Device orientation for compass-relative screen direction
- Device motion for subtle organic deformation

Mobile browsers require HTTPS for location and motion sensors. iOS asks for motion permission only after a user gesture, so permission is requested from the **Set** button.

## Run locally

```sh
npm install
npm run dev -- --host
```

Local desktop testing works at `http://localhost:5173`, but physical phones need an HTTPS deployment to expose GPS, compass, and motion reliably.

## Build

```sh
npm run build
npm run preview -- --host
```

The production output is written to `dist/`. The bundled web manifest and service worker make it installable and offline-ready after the first successful load.

## Native prototypes

Earlier watchOS and Wear OS experiments remain in `native/`. The web POC in `src/` is the current testable product surface.
