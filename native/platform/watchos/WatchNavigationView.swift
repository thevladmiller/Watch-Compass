import SwiftUI

struct WatchNavigationView: View {
    @ObservedObject var model: WatchNavigationModel

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            Circle()
                .strokeBorder(Color.white.opacity(0.16), lineWidth: 6)
                .frame(width: 140, height: 140)

            Circle()
                .trim(from: 0, to: 0.72)
                .stroke(Color.yellow, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: 140, height: 140)

            VStack(spacing: 6) {
                Text(model.distanceMetersText)
                    .font(.system(size: 30, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                Text(model.confidenceText)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.7))
            }

            VStack {
                Spacer()
                HStack {
                    Spacer()
                    ArrowIndicator(rotation: model.arrowRotationDegrees)
                        .frame(width: 28, height: 28)
                }
            }
            .padding(10)

            VStack {
                Spacer()
                Button(model.anchored ? "Reset" : "Mark") {
                    if model.anchored {
                        model.resetSession()
                    } else {
                        model.markStartPoint()
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(.white.opacity(0.14))
                .foregroundColor(.white)
            }
            .padding(.bottom, 12)
        }
    }
}

private struct ArrowIndicator: View {
    let rotation: Double

    var body: some View {
        Image(systemName: "arrow.up")
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(.white)
            .rotationEffect(.degrees(rotation))
            .shadow(color: .black.opacity(0.35), radius: 3, x: 0, y: 1)
    }
}

