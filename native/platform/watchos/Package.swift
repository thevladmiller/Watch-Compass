// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WatchNavigation",
    platforms: [
        .watchOS(.v10)
    ],
    products: [
        .library(name: "WatchNavigation", targets: ["WatchNavigation"])
    ],
    targets: [
        .target(
            name: "WatchNavigation",
            path: ".",
            sources: [
                "WatchNavigationApp.swift",
                "WatchNavigationModel.swift",
                "WatchNavigationView.swift"
            ]
        )
    ]
)

