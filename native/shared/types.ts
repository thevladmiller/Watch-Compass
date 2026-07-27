export type Vector2 = {
  x: number;
  y: number;
};

export type NavigationSample = {
  steps: number;
  headingDegrees: number;
  timestamp: number;
};

export type AnchorPoint = {
  timestamp: number;
  originHeadingDegrees: number;
};

export type NavigationState = {
  anchored: boolean;
  anchor: AnchorPoint | null;
  position: Vector2;
  distanceMeters: number;
  bearingToOriginDegrees: number;
  returnHeadingDegrees: number;
  confidence: number;
  stepLengthMeters: number;
  lastUpdateAt: number | null;
};

export type NavigationConfig = {
  stepLengthMeters: number;
  driftDecayPerMeter: number;
};

