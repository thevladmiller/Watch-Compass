import type {
  AnchorPoint,
  NavigationConfig,
  NavigationSample,
  NavigationState,
  Vector2,
} from "./types";

const DEFAULT_CONFIG: NavigationConfig = {
  stepLengthMeters: 0.78,
  driftDecayPerMeter: 0.06,
};

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

function shortestAngleDelta(from: number, to: number) {
  const delta = normalizeDegrees(to) - normalizeDegrees(from);
  if (delta > 180) return delta - 360;
  if (delta < -180) return delta + 360;
  return delta;
}

function vectorMagnitude(vector: Vector2) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function vectorFromHeading(headingDegrees: number, distanceMeters: number): Vector2 {
  const radians = degToRad(headingDegrees);
  return {
    x: Math.sin(radians) * distanceMeters,
    y: -Math.cos(radians) * distanceMeters,
  };
}

function bearingFromVector(vector: Vector2) {
  const angle = radToDeg(Math.atan2(vector.x, -vector.y));
  return normalizeDegrees(angle);
}

export function createAnchor(timestamp: number, originHeadingDegrees: number): AnchorPoint {
  return {
    timestamp,
    originHeadingDegrees: normalizeDegrees(originHeadingDegrees),
  };
}

export function createIdleState(stepLengthMeters = DEFAULT_CONFIG.stepLengthMeters): NavigationState {
  return {
    anchored: false,
    anchor: null,
    position: { x: 0, y: 0 },
    distanceMeters: 0,
    bearingToOriginDegrees: 0,
    returnHeadingDegrees: 0,
    confidence: 0,
    stepLengthMeters,
    lastUpdateAt: null,
  };
}

export function markOrigin(
  current: NavigationState,
  sample: NavigationSample,
  config: Partial<NavigationConfig> = {},
): NavigationState {
  const nextConfig = { ...DEFAULT_CONFIG, ...config };
  const anchor = createAnchor(sample.timestamp, sample.headingDegrees);

  return {
    anchored: true,
    anchor,
    position: { x: 0, y: 0 },
    distanceMeters: 0,
    bearingToOriginDegrees: normalizeDegrees(sample.headingDegrees),
    returnHeadingDegrees: normalizeDegrees(sample.headingDegrees + 180),
    confidence: 1,
    stepLengthMeters: nextConfig.stepLengthMeters,
    lastUpdateAt: sample.timestamp,
  };
}

export function applyNavigationSample(
  current: NavigationState,
  sample: NavigationSample,
  config: Partial<NavigationConfig> = {},
): NavigationState {
  if (!current.anchored || !current.anchor) {
    return current;
  }

  const nextConfig = { ...DEFAULT_CONFIG, ...config };
  const stepDistance = Math.max(0, sample.steps) * nextConfig.stepLengthMeters;
  const headingDelta = shortestAngleDelta(current.anchor.originHeadingDegrees, sample.headingDegrees);
  const correctedHeading = normalizeDegrees(sample.headingDegrees - headingDelta * 0.35);
  const movement = vectorFromHeading(correctedHeading, stepDistance);
  const position = {
    x: current.position.x + movement.x,
    y: current.position.y + movement.y,
  };
  const distanceMeters = vectorMagnitude(position);
  const bearingToOriginDegrees = bearingFromVector({
    x: -position.x,
    y: -position.y,
  });
  const returnHeadingDegrees = bearingToOriginDegrees;
  const driftPenalty = Math.min(0.7, distanceMeters * nextConfig.driftDecayPerMeter);
  const confidence = Math.max(0, 1 - driftPenalty - Math.min(0.2, Math.abs(headingDelta) / 720));

  return {
    ...current,
    position,
    distanceMeters,
    bearingToOriginDegrees,
    returnHeadingDegrees,
    confidence,
    stepLengthMeters: nextConfig.stepLengthMeters,
    lastUpdateAt: sample.timestamp,
  };
}

export function resetNavigation(stepLengthMeters = DEFAULT_CONFIG.stepLengthMeters): NavigationState {
  return createIdleState(stepLengthMeters);
}

