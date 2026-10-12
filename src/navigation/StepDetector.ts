import { GRAVITY, magnitude } from "./math";
import type { Vector3 } from "./types";

export type StepEvent = { timestamp: number; intensity: number };

export class StepDetector {
  private baseline = GRAVITY;
  private filtered = 0;
  private previous = 0;
  private lastStepTimestamp = -Infinity;

  update(timestamp: number, accelerationIncludingGravity: Vector3): StepEvent | null {
    const currentMagnitude = magnitude(accelerationIncludingGravity);
    this.baseline += (currentMagnitude - this.baseline) * 0.04;
    const highPass = currentMagnitude - this.baseline;
    this.filtered += (highPass - this.filtered) * 0.32;

    const crossedPeak = this.previous > 0.85 && this.filtered < this.previous;
    const enoughTimePassed = timestamp - this.lastStepTimestamp > 280;
    const plausiblePeak = this.previous < 5.5;
    this.previous = this.filtered;

    if (!crossedPeak || !enoughTimePassed || !plausiblePeak) return null;
    this.lastStepTimestamp = timestamp;
    return { timestamp, intensity: Math.max(0, this.previous) };
  }

  reset() {
    this.baseline = GRAVITY;
    this.filtered = 0;
    this.previous = 0;
    this.lastStepTimestamp = -Infinity;
  }
}

