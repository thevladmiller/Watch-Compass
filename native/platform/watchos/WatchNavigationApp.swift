import SwiftUI

@main
struct WatchNavigationApp: App {
    @StateObject private var model = WatchNavigationModel()

    var body: some Scene {
        WindowGroup {
            WatchNavigationView(model: model)
        }
    }
}

