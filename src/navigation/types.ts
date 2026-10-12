export type Vector3 = { x: number; y: number; z: number };

export type Quaternion = { w: number; x: number; y: number; z: number };

export type OrientationSample = {
  timestamp: number;
  quaternion: Quaternion;
  heading: number;
  magneticReliable: boolean;
};

export type MotionSample = {
  timestamp: number;
  acceleration: Vector3;
  accelerationIncludingGravity: Vector3;
  rotationRate: Vector3;
};

export type LocalPosition = Vector3;

