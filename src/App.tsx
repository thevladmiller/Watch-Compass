import * as React from "react";
import {
  DriftController,
  IMUIntegrator,
  OrientationFilter,
  PDRTracker,
  StepDetector,
  linearAccelerationWorld,
  normalizeDegrees,
  type OrientationSample,
  type Vector3,
} from "./navigation";

type SensorPermission = "idle" | "granted" | "limited";

const TUTORIAL_KEY = "watch-compass-tutorial-seen";
const FULL_RESET_RADIANS = Math.PI * 6;

function shortestAngleDelta(from: number, to: number) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
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
  const [tracking, setTracking] = React.useState(false);
  const [distance, setDistance] = React.useState(0);
  const [bearing, setBearing] = React.useState(0);
  const [heading, setHeading] = React.useState(0);
  const [motion, setMotion] = React.useState({ x: 0, y: 0 });
  const [permission, setPermission] = React.useState<SensorPermission>("idle");
  const [message, setMessage] = React.useState("Tap Set to remember this place");
  const [resetProgress, setResetProgress] = React.useState(0);
  const gestureRef = React.useRef({ active: false, lastAngle: 0, travel: 0 });
  const trackingRef = React.useRef(false);
  const headingRef = React.useRef(0);
  const orientationRef = React.useRef<OrientationSample | null>(null);
  const orientationFilterRef = React.useRef(new OrientationFilter());
  const stepDetectorRef = React.useRef(new StepDetector());
  const pdrTrackerRef = React.useRef(new PDRTracker());
  const imuIntegratorRef = React.useRef(new IMUIntegrator());
  const driftControllerRef = React.useRef(new DriftController());

  const reset = React.useCallback(() => {
    trackingRef.current = false;
    setTracking(false);
    setDistance(0);
    setBearing(0);
    setResetProgress(0);
    setMessage("Tap Set to remember this place");
    orientationFilterRef.current.reset(headingRef.current);
    stepDetectorRef.current.reset();
    pdrTrackerRef.current.reset();
    imuIntegratorRef.current.reset();
    driftControllerRef.current.reset();
  }, []);

  React.useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      const compassHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (event.alpha === null || event.beta === null || event.gamma === null) return;
      const orientation = orientationFilterRef.current.updateAbsolute(
        event.timeStamp,
        event.alpha,
        event.beta,
        event.gamma,
        compassHeading,
      );
      orientationRef.current = orientation;
      headingRef.current = orientation.heading;
      setHeading(orientation.heading);
    };
    const onMotion = (event: DeviceMotionEvent) => {
      const gravityAcceleration = event.accelerationIncludingGravity;
      if (!gravityAcceleration) return;
      const rotationRate: Vector3 = {
        x: event.rotationRate?.beta ?? 0,
        y: event.rotationRate?.gamma ?? 0,
        z: event.rotationRate?.alpha ?? 0,
      };
      orientationFilterRef.current.updateGyroscope(event.timeStamp, rotationRate);
      setMotion({
        x: Math.max(-1, Math.min(1, (gravityAcceleration.x ?? 0) / 9.81)),
        y: Math.max(-1, Math.min(1, (gravityAcceleration.y ?? 0) / 9.81)),
      });
      if (!trackingRef.current || !orientationRef.current) return;

      const rawAcceleration: Vector3 = {
        x: event.acceleration?.x ?? gravityAcceleration.x ?? 0,
        y: event.acceleration?.y ?? gravityAcceleration.y ?? 0,
        z: event.acceleration?.z ?? gravityAcceleration.z ?? 0,
      };
      const worldAcceleration = linearAccelerationWorld(rawAcceleration, orientationRef.current.quaternion, Boolean(event.acceleration));
      imuIntegratorRef.current.update(event.timeStamp, worldAcceleration);
      if (driftControllerRef.current.update(event.timeStamp, worldAcceleration, rotationRate)) {
        imuIntegratorRef.current.zeroVelocity();
      }

      const step = stepDetectorRef.current.update(event.timeStamp, {
        x: gravityAcceleration.x ?? 0,
        y: gravityAcceleration.y ?? 0,
        z: gravityAcceleration.z ?? 0,
      });
      if (!step) return;
      const nextPosition = pdrTrackerRef.current.addStep(step, headingRef.current);
      const nextDistance = Math.hypot(nextPosition.x, nextPosition.y);
      const bearingToOrigin = normalizeDegrees(Math.atan2(-nextPosition.x, -nextPosition.y) * 180 / Math.PI);
      setDistance(nextDistance);
      setBearing(bearingToOrigin);
      setMessage(`${Math.round(nextDistance / 0.72)} steps from origin`);
    };
    window.addEventListener("deviceorientation", onOrientation, true);
    window.addEventListener("devicemotion", onMotion, true);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation, true);
      window.removeEventListener("devicemotion", onMotion, true);
    };
  }, []);

  async function setOrigin() {
    setMessage("Starting motion sensors…");
    try {
      const granted = await requestMotionPermission();
      setPermission(granted ? "granted" : "limited");
      if (!granted) {
        setMessage("Allow motion access, then tap Set again");
        return;
      }
    } catch {
      setPermission("limited");
      setMessage("Allow motion access, then tap Set again");
      return;
    }
    orientationFilterRef.current.reset(headingRef.current);
    stepDetectorRef.current.reset();
    pdrTrackerRef.current.reset();
    imuIntegratorRef.current.reset();
    driftControllerRef.current.reset();
    trackingRef.current = true;
    setTracking(true);
    setDistance(0);
    setBearing(0);
    setMessage("Origin set · walk away");
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
    if (!gesture.active || !tracking) return;
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
  const travel = tracking ? Math.min(1, distance) : 0;
  const directionX = Math.cos(radians);
  const directionY = Math.sin(radians);
  const horizontalLimit = window.innerWidth / 2 - 5;
  const verticalLimit = window.innerHeight / 2 - 5;
  const horizontalScale = Math.abs(directionX) > 0.001 ? horizontalLimit / Math.abs(directionX) : Number.POSITIVE_INFINITY;
  const verticalScale = Math.abs(directionY) > 0.001 ? verticalLimit / Math.abs(directionY) : Number.POSITIVE_INFINITY;
  const edgeScale = Math.min(horizontalScale, verticalScale);
  const edgeX = directionX * edgeScale;
  const edgeY = directionY * edgeScale;
  const edgeCompression = Math.min(1, Math.max(0, (distance - 1) / 12));
  const blobPhase = distance < 0.12 ? "origin" : distance < 1 ? "travel" : distance < 4 ? "corner" : "settled";
  const blobStyle = {
    "--blob-x": `${edgeX * travel}px`,
    "--blob-y": `${edgeY * travel}px`,
    "--blob-scale": 1 - edgeCompression * 0.36,
    "--blob-tilt-x": motion.x,
    "--blob-tilt-y": motion.y,
    "--blob-angle": `${relativeBearing}deg`,
    "--blob-settle": edgeCompression,
    "--blob-settle-x": 1 - edgeCompression * 0.18,
    "--blob-settle-y": 0.74 - edgeCompression * 0.18,
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
      {!tracking ? (
        <button className="set-button" type="button" onClick={setOrigin}>Set</button>
      ) : (
        <>
          <div className="distance-readout"><strong>{Math.round(distance)}</strong><span>metres away</span></div>
          <div className={`goo-blob goo-blob--${blobPhase}`} style={blobStyle} aria-label="Direction back to your origin">
            <div className="goo-form" />
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
    { number: "01", title: "Set your origin", body: "Stand where you want to return to. Tap Set and allow motion and orientation access. GPS is never used.", art: <div className="tutorial-set">Set</div> },
    { number: "02", title: "Follow the goo", body: "Walk away with your phone. Steps and compass heading move the white form toward the edge pointing back to your start.", art: <div className="tutorial-goo" /> },
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
