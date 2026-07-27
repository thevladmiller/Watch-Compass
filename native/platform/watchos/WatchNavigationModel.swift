import Foundation
import CoreMotion
import Combine

final class WatchNavigationModel: NSObject, ObservableObject {
    @Published var distanceMetersText: String = "0 m"
    @Published var bearingText: String = "—"
    @Published var confidenceText: String = "0%"
    @Published var arrowRotationDegrees: Double = 0
    @Published var anchored: Bool = false

    private let motionManager = CMMotionManager()
    private let pedometer = CMPedometer()
    private var stepCount: Int = 0
    private var originHeadingDegrees: Double = 0
    private var currentHeadingDegrees: Double = 0
    private var positionX: Double = 0
    private var positionY: Double = 0
    private let stepLengthMeters: Double = 0.78

    override init() {
        super.init()
        startMotionUpdates()
        startPedometerUpdates()
        refreshViewModel()
    }

    func markStartPoint() {
        anchored = true
        stepCount = 0
        positionX = 0
        positionY = 0
        originHeadingDegrees = currentHeadingDegrees
        refreshViewModel()
    }

    func resetSession() {
        anchored = false
        stepCount = 0
        originHeadingDegrees = 0
        currentHeadingDegrees = 0
        positionX = 0
        positionY = 0
        refreshViewModel()
    }

    private func startMotionUpdates() {
        guard motionManager.isDeviceMotionAvailable else {
            return
        }

        motionManager.deviceMotionUpdateInterval = 0.2
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, let motion else { return }
            let heading = motion.attitude.yaw * 180 / .pi
            self.currentHeadingDegrees = heading < 0 ? heading + 360 : heading
            if self.anchored {
                self.integrateStep(headingDegrees: self.currentHeadingDegrees)
            }
            self.refreshViewModel()
        }
    }

    private func startPedometerUpdates() {
        guard CMPedometer.isStepCountingAvailable() else {
            return
        }

        pedometer.startUpdates(from: Date()) { [weak self] data, _ in
            guard let self, let data else { return }
            let totalSteps = data.numberOfSteps.intValue
            let deltaSteps = max(0, totalSteps - self.stepCount)
            self.stepCount = totalSteps

            guard self.anchored else {
                self.refreshViewModel()
                return
            }

            let headingRadians = self.currentHeadingDegrees * .pi / 180
            self.positionX += sin(headingRadians) * self.stepLengthMeters * Double(deltaSteps)
            self.positionY += -cos(headingRadians) * self.stepLengthMeters * Double(deltaSteps)
            self.refreshViewModel()
        }
    }

    private func refreshViewModel() {
        let distance = sqrt(positionX * positionX + positionY * positionY)
        distanceMetersText = "\(Int(distance.rounded())) m"
        confidenceText = anchored ? "\(max(0, 100 - Int(distance * 6)))%" : "0%"
        bearingText = anchored ? "\(Int(returnHeadingDegrees().rounded()))°" : "—"
        arrowRotationDegrees = anchored ? returnHeadingDegrees() : 0
    }

    private func returnHeadingDegrees() -> Double {
        let dx = -positionX
        let dy = -positionY
        let angle = atan2(dx, -dy) * 180 / .pi
        return angle < 0 ? angle + 360 : angle
    }
}
