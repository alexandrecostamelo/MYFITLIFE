import Foundation

struct WatchData: Codable {
    let streak: Int
    let readinessScore: Int
    let readinessZone: String
    let todayWorkout: String?
    let todayWorkoutDone: Bool
    let todayMinutes: Int
    let sleepScore: Int
    let updatedAt: String

    static func load() -> WatchData? {
        guard let defaults = UserDefaults(suiteName: "group.app.myfitlife.shared"),
              let json = defaults.string(forKey: "widgetData"),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WatchData.self, from: data)
    }

    static var placeholder: WatchData {
        WatchData(
            streak: 0,
            readinessScore: 50,
            readinessZone: "yellow",
            todayWorkout: nil,
            todayWorkoutDone: false,
            todayMinutes: 0,
            sleepScore: 0,
            updatedAt: ""
        )
    }
}
