import { GRAVITY, magnitude } from "./math";
import type { Vector3 } from "./types";

export type StepEvent = { timestamp: number; intensity: number };

export class StepDetector {
  private baseline = GRAVITY;
  private filtered = 0;
  private previous = 0;
  private lastStepTimestamp = -Infinity;
  private armed = true;

  update(timestamp: number, accelerationIncludingGravity: Vector3): StepEvent | null {
    const currentMagnitude = magnitude(accelerationIncludingGravity);
    this.baseline += (currentMagnitude - this.baseline) * 0.04;
    const highPass = currentMagnitude - this.baseline;
    this.filtered += (highPass - this.filtered) * 0.32;

    const crossedThreshold = this.previous <= 1.1 && this.filtered > 1.1;
    const enoughTimePassed = timestamp - this.lastStepTimestamp > 360;
    const plausiblePeak = this.filtered < 5.5;
    this.previous = this.filtered;

    if (!this.armed && this.filtered < 0.12) this.armed = true;
    if (!this.armed || !crossedThreshold || !enoughTimePassed || !plausiblePeak) return null;
    this.armed = false;
    this.lastStepTimestamp = timestamp;
    return { timestamp, intensity: Math.max(0, this.filtered) };
  }

  reset() {
    this.baseline = GRAVITY;
    this.filtered = 0;
    this.previous = 0;
    this.lastStepTimestamp = -Infinity;
    this.armed = true;
  }
}

