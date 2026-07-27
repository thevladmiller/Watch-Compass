import type { NavigationState } from "../shared";

export type WatchScreenModel = {
  distanceLabel: string;
  headingLabel: string;
  ringProgress: number;
  confidenceLabel: string;
  arrowRotationDegrees: number;
  anchored: boolean;
};

export function buildWatchScreenModel(state: NavigationState): WatchScreenModel {
  const distance = Math.round(state.distanceMeters);
  const direction = state.anchored ? state.returnHeadingDegrees : 0;
  return {
    distanceLabel: `${distance} m`,
    headingLabel: state.anchored ? `${Math.round(state.returnHeadingDegrees)}°` : "—",
    ringProgress: Math.min(1, state.distanceMeters / 250),
    confidenceLabel: `${Math.round(state.confidence * 100)}%`,
    arrowRotationDegrees: direction,
    anchored: state.anchored,
  };
}

export function renderWatchScreen(model: WatchScreenModel) {
  return {
    background: "bauhaus-black",
    centerText: model.distanceLabel,
    edgeArrowRotation: model.arrowRotationDegrees,
    statusText: model.anchored ? `Return bearing ${model.headingLabel}` : "Mark start point",
    confidenceText: `Signal ${model.confidenceLabel}`,
    ringProgress: model.ringProgress,
  };
}

