import type { LocalPosition, Vector3 } from "./types";

export class IMUIntegrator {
  position: LocalPosition = { x: 0, y: 0, z: 0 };
  velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private lastTimestamp: number | null = null;

  update(timestamp: number, acceleration: Vector3) {
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      return this.position;
    }
    const deltaSeconds = Math.min(0.1, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;
    this.velocity = {
      x: this.velocity.x + acceleration.x * deltaSeconds,
      y: this.velocity.y + acceleration.y * deltaSeconds,
      z: this.velocity.z + acceleration.z * deltaSeconds,
    };
    this.position = {
      x: this.position.x + this.velocity.x * deltaSeconds,
      y: this.position.y + this.velocity.y * deltaSeconds,
      z: this.position.z + this.velocity.z * deltaSeconds,
    };
    return this.position;
  }

  zeroVelocity() {
    this.velocity = { x: 0, y: 0, z: 0 };
  }

  reset() {
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.lastTimestamp = null;
  }
}

