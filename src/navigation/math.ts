import type { Quaternion, Vector3 } from "./types";

export const GRAVITY = 9.80665;

export function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

export function shortestDegrees(from: number, to: number) {
  return ((to - from + 540) % 360) - 180;
}

export function magnitude(vector: Vector3) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function normalizeQuaternion(quaternion: Quaternion): Quaternion {
  const length = Math.hypot(quaternion.w, quaternion.x, quaternion.y, quaternion.z) || 1;
  return {
    w: quaternion.w / length,
    x: quaternion.x / length,
    y: quaternion.y / length,
    z: quaternion.z / length,
  };
}

export function quaternionFromEuler(alpha: number, beta: number, gamma: number): Quaternion {
  const z = alpha * Math.PI / 360;
  const x = beta * Math.PI / 360;
  const y = gamma * Math.PI / 360;
  const cz = Math.cos(z);
  const sz = Math.sin(z);
  const cx = Math.cos(x);
  const sx = Math.sin(x);
  const cy = Math.cos(y);
  const sy = Math.sin(y);

  return normalizeQuaternion({
    w: cz * cx * cy - sz * sx * sy,
    x: cz * sx * cy - sz * cx * sy,
    y: cz * cx * sy + sz * sx * cy,
    z: sz * cx * cy + cz * sx * sy,
  });
}

export function rotateVector(quaternion: Quaternion, vector: Vector3): Vector3 {
  const { w, x, y, z } = quaternion;
  const tx = 2 * (y * vector.z - z * vector.y);
  const ty = 2 * (z * vector.x - x * vector.z);
  const tz = 2 * (x * vector.y - y * vector.x);
  return {
    x: vector.x + w * tx + (y * tz - z * ty),
    y: vector.y + w * ty + (z * tx - x * tz),
    z: vector.z + w * tz + (x * ty - y * tx),
  };
}

export function inverseQuaternion(quaternion: Quaternion): Quaternion {
  return { w: quaternion.w, x: -quaternion.x, y: -quaternion.y, z: -quaternion.z };
}

