import * as React from "react";

type Point = { latitude: number; longitude: number };
type SensorPermission = "idle" | "granted" | "limited";

const TUTORIAL_KEY = "watch-compass-tutorial-seen";
const FULL_RESET_RADIANS = Math.PI * 6;

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function shortestAngleDelta(from: number, to: number) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function distanceAndBearing(from: Point, to: Point) {
  const earthRadius = 6_371_000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(longitudeDelta / 2) ** 2;
  const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const y = Math.sin(longitudeDelta) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(longitudeDelta);
  const bearing = normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
  return { distance, bearing };
}

async function requestMotionPermission() {
  const orientationEvent = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
  const motionEvent = DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
  const responses = await Promise.all([
    orientationEvent.requestPermission?.() ?? Promise.resolve("granted"),
    motionEvent.requestPermission?.() ?? Promise.resolve("granted"),
  ]);
  return responses.every((response) => response === "granted");
}

export default function App() {
  const [tutorialOpen, setTutorialOpen] = React.useState(() => window.localStorage.getItem(TUTORIAL_KEY) !== "true");
  const [anchor, setAnchor] = React.useState<Point | null>(null);
  const [position, setPosition] = React.useState<Point | null>(null);
  const [distance, setDistance] = React.useState(0);
  const [bearing, setBearing] = React.useState(0);
  const [heading, setHeading] = React.useState(0);
  const [motion, setMotion] = React.useState({ x: 0, y: 0 });
  const [permission, setPermission] = React.useState<SensorPermission>("idle");
  const [message, setMessage] = React.useState("Tap Set to remember this place");
  const [resetProgress, setResetProgress] = React.useState(0);
  const watchIdRef = React.useRef<number | null>(null);
  const gestureRef = React.useRef({ active: false, lastAngle: 0, travel: 0 });

  const reset = React.useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setAnchor(null);
    setPosition(null);
    setDistance(0);
    setBearing(0);
    setResetProgress(0);
    setMessage("Tap Set to remember this place");
  }, []);

  React.useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      const compassHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof compassHeading === "number") setHeading(compassHeading);
      else if (event.alpha !== null) setHeading(normalizeDegrees(360 - event.alpha));
    };
    const onMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;
      setMotion({
        x: Math.max(-1, Math.min(1, (acceleration.x ?? 0) / 9.81)),
        y: Math.max(-1, Math.min(1, (acceleration.y ?? 0) / 9.81)),
      });
    };
    window.addEventListener("deviceorientation", onOrientation, true);
    window.addEventListener("devicemotion", onMotion, true);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation, true);
      window.removeEventListener("devicemotion", onMotion, true);
    };
  }, []);

  React.useEffect(() => {
    if (!anchor || !position) return;
    const next = distanceAndBearing(position, anchor);
    setDistance(next.distance);
    setBearing(next.bearing);
  }, [anchor, position]);

  React.useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  async function setOrigin() {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser");
      setPermission("limited");
      return;
    }
    setMessage("Finding your position…");
    try {
      setPermission((await requestMotionPermission()) ? "granted" : "limited");
    } catch {
      setPermission("limited");
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const origin = { latitude: result.coords.latitude, longitude: result.coords.longitude };
        setAnchor(origin);
        setPosition(origin);
        setDistance(0);
        setMessage("Origin set · move away");
        watchIdRef.current = navigator.geolocation.watchPosition(
          (update) => setPosition({ latitude: update.coords.latitude, longitude: update.coords.longitude }),
          () => setMessage("Waiting for a clear location signal…"),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 },
        );
      },
      () => {
        setPermission("limited");
        setMessage("Allow precise location, then tap Set again");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  }

  function pointerAngle(event: React.PointerEvent) {
    return Math.atan2(event.clientY - window.innerHeight / 2, event.clientX - window.innerWidth / 2);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = { active: true, lastAngle: pointerAngle(event), travel: 0 };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture.active || !anchor) return;
    const nextAngle = pointerAngle(event);
    const delta = shortestAngleDelta(gesture.lastAngle, nextAngle);
    gesture.lastAngle = nextAngle;
    gesture.travel = Math.min(0, gesture.travel + delta);
    if (delta > 0.25) gesture.travel = Math.min(0, gesture.travel + delta * 1.8);
    const progress = Math.min(1, Math.abs(gesture.travel) / FULL_RESET_RADIANS);
    setResetProgress(progress);
    if (gesture.travel <= -FULL_RESET_RADIANS) {
      gesture.active = false;
      reset();
      if (navigator.vibrate) navigator.vibrate([40, 40, 80]);
    }
  }

  function endGesture(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gestureRef.current.active = false;
    gestureRef.current.travel = 0;
    setResetProgress(0);
  }

  const relativeBearing = normalizeDegrees(bearing - heading);
  const radians = ((relativeBearing - 90) * Math.PI) / 180;
  const travel = anchor ? Math.min(1, distance) : 0;
  const directionX = Math.cos(radians);
  const directionY = Math.sin(radians);
  const horizontalLimit = window.innerWidth / 2 - 5;
  const verticalLimit = window.innerHeight / 2 - 5;
  const horizontalScale = Math.abs(directionX) > 0.001 ? horizontalLimit / Math.abs(directionX) : Number.POSITIVE_INFINITY;
  const verticalScale = Math.abs(directionY) > 0.001 ? verticalLimit / Math.abs(directionY) : Number.POSITIVE_INFINITY;
  const edgeScale = Math.min(horizontalScale, verticalScale);
  const edgeX = directionX * edgeScale;
  const edgeY = directionY * edgeScale;
  const edgeCompression = Math.min(1, Math.max(0, (distance - 1) / 24));
  const blobStyle = {
    "--blob-x": `${edgeX * travel}px`,
    "--blob-y": `${edgeY * travel}px`,
    "--blob-scale": 1 - edgeCompression * 0.42,
    "--blob-tilt-x": motion.x,
    "--blob-tilt-y": motion.y,
    "--blob-angle": `${relativeBearing}deg`,
  } as React.CSSProperties;

  function finishTutorial() {
    window.localStorage.setItem(TUTORIAL_KEY, "true");
    setTutorialOpen(false);
  }

  return (
    <main className="compass-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endGesture} onPointerCancel={endGesture}>
      <div className="ambient-grain" />
      <header className="status-bar" aria-live="polite">
        <span className={`signal-dot signal-dot--${permission}`} />
        <span>{message}</span>
      </header>
      {!anchor ? (
        <button className="set-button" type="button" onClick={setOrigin}>Set</button>
      ) : (
        <>
          <div className="distance-readout"><strong>{Math.round(distance)}</strong><span>metres away</span></div>
          <div className="goo-blob" style={blobStyle} aria-label="Direction back to your origin">
          </div>
          <div className="reset-ring" style={{ "--reset-progress": resetProgress } as React.CSSProperties}><span>3× counterclockwise to reset</span></div>
        </>
      )}
      {tutorialOpen && <Tutorial onDone={finishTutorial} />}
    </main>
  );
}

function Tutorial({ onDone }: { onDone: () => void }) {
  const [page, setPage] = React.useState(0);
  const steps = [
    { number: "01", title: "Set your origin", body: "Stand where you want to return to. Tap Set and allow precise location and motion access.", art: <div className="tutorial-set">Set</div> },
    { number: "02", title: "Follow the goo", body: "Move one metre and the white form reaches the edge that points back to your starting place.", art: <div className="tutorial-goo" /> },
    { number: "03", title: "Circle to reset", body: "Draw three full counterclockwise circles anywhere on screen. Keep your finger down until it resets.", art: <div className="tutorial-circle">↺<b>3</b></div> },
  ];
  const step = steps[page];
  return (
    <section className="tutorial" aria-label="How Watch Compass works">
      <div className="tutorial-card">
        <div className="tutorial-topline"><span>Watch Compass</span><span>{step.number} / 03</span></div>
        <div className="tutorial-art">{step.art}</div>
        <div><h1>{step.title}</h1><p>{step.body}</p></div>
        <div className="tutorial-actions">
          <div className="tutorial-dots">{steps.map((_, index) => <i key={index} className={index === page ? "active" : ""} />)}</div>
          <button type="button" onClick={() => page < steps.length - 1 ? setPage(page + 1) : onDone()}>{page < steps.length - 1 ? "Next" : "Start"}</button>
        </div>
      </div>
    </section>
  );
}
