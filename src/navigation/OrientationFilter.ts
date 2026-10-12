import { normalizeDegrees, quaternionFromEuler, shortestDegrees } from "./math";
import type { OrientationSample, Vector3 } from "./types";

export class OrientationFilter {
  private heading = 0;
  private lastTimestamp: number | null = null;
  private magneticReliable = false;

  updateGyroscope(timestamp: number, rotationRate: Vector3) {
    if (this.lastTimestamp !== null) {
      const deltaSeconds = Math.min(0.1, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
      this.heading = normalizeDegrees(this.heading - rotationRate.z * deltaSeconds);
    }
    this.lastTimestamp = timestamp;
  }

  updateAbsolute(timestamp: number, alpha: number, beta: number, gamma: number, compassHeading?: number): OrientationSample {
    const measuredHeading = normalizeDegrees(compassHeading ?? 360 - alpha);
    const correction = shortestDegrees(this.heading, measuredHeading);

    // Large one-frame compass jumps are usually magnetic interference. Gyroscope
    // propagation remains active while the absolute heading is down-weighted.
    this.magneticReliable = Math.abs(correction) < 45 || this.lastTimestamp === null;
    const correctionWeight = this.magneticReliable ? 0.12 : 0.015;
    this.heading = normalizeDegrees(this.heading + correction * correctionWeight);
    this.lastTimestamp = timestamp;

    return {
      timestamp,
      quaternion: quaternionFromEuler(360 - this.heading, beta, gamma),
      heading: this.heading,
      magneticReliable: this.magneticReliable,
    };
  }

  reset(heading = 0) {
    this.heading = normalizeDegrees(heading);
    this.lastTimestamp = null;
    this.magneticReliable = false;
  }
}

