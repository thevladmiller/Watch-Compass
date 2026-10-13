import { normalizeDegrees, quaternionFromEuler } from "./math";
import type { OrientationSample, Vector3 } from "./types";

export class OrientationFilter {
  private heading = 0;
  private lastTimestamp: number | null = null;
  private lastAbsoluteTimestamp: number | null = null;
  private magneticReliable = false;

  updateGyroscope(timestamp: number, rotationRate: Vector3) {
    if (this.lastTimestamp !== null && (this.lastAbsoluteTimestamp === null || timestamp - this.lastAbsoluteTimestamp > 80)) {
      const deltaSeconds = Math.min(0.1, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
      this.heading = normalizeDegrees(this.heading - rotationRate.z * deltaSeconds);
    }
    this.lastTimestamp = timestamp;
  }

  updateAbsolute(timestamp: number, alpha: number, beta: number, gamma: number, compassHeading?: number): OrientationSample {
    const measuredHeading = normalizeDegrees(compassHeading ?? 360 - alpha);
    // Mobile browsers expose an orientation already fused by the operating system.
    // Use that absolute result directly so legitimate turns are never mistaken for
    // magnetic spikes; gyroscope propagation only fills gaps between these samples.
    this.heading = measuredHeading;
    this.magneticReliable = compassHeading !== undefined;
    this.lastTimestamp = timestamp;
    this.lastAbsoluteTimestamp = timestamp;

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
    this.lastAbsoluteTimestamp = null;
    this.magneticReliable = false;
  }
}

