import type { LocalPosition } from "./types";
import type { StepEvent } from "./StepDetector";

export class PDRTracker {
  position: LocalPosition = { x: 0, y: 0, z: 0 };

  constructor(private readonly stepLength = 0.72) {}

  addStep(_step: StepEvent, headingDegrees: number) {
    const radians = headingDegrees * Math.PI / 180;
    this.position = {
      x: this.position.x + this.stepLength * Math.sin(radians),
      y: this.position.y + this.stepLength * Math.cos(radians),
      z: this.position.z,
    };
    return this.position;
  }

  reset() {
    this.position = { x: 0, y: 0, z: 0 };
  }
}

