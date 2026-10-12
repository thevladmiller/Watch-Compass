import { magnitude } from "./math";
import type { Vector3 } from "./types";

export class DriftController {
  private stillSince: number | null = null;

  update(timestamp: number, linearAcceleration: Vector3, rotationRate: Vector3) {
    const still = magnitude(linearAcceleration) < 0.24 && magnitude(rotationRate) < 2.2;
    if (!still) {
      this.stillSince = null;
      return false;
    }
    this.stillSince ??= timestamp;
    return timestamp - this.stillSince > 450;
  }

  reset() {
    this.stillSince = null;
  }
}

