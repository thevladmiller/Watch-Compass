import { GRAVITY, inverseQuaternion, rotateVector } from "./math";
import type { Quaternion, Vector3 } from "./types";

const GRAVITY_WORLD: Vector3 = { x: 0, y: 0, z: -GRAVITY };

export function linearAccelerationWorld(rawAcceleration: Vector3, orientation: Quaternion, alreadyLinear = false): Vector3 {
  if (alreadyLinear) return rotateVector(orientation, rawAcceleration);

  const gravityDevice = rotateVector(inverseQuaternion(orientation), GRAVITY_WORLD);
  const linearDevice = {
    x: rawAcceleration.x - gravityDevice.x,
    y: rawAcceleration.y - gravityDevice.y,
    z: rawAcceleration.z - gravityDevice.z,
  };
  return rotateVector(orientation, linearDevice);
}

