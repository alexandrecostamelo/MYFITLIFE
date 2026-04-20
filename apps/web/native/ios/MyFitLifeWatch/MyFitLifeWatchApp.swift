import SwiftUI

@main
struct MyFitLifeWatchApp: App {
    init() {
        WatchReceiver.shared.activate()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        let data = WatchData.load()
        VStack(spacing: 12) {
            Text("\u{1F525} \(data?.streak ?? 0)")
                .font(.system(size: 28, weight: .light, design: .monospaced))
                .foregroundColor(Color(hex: "#00D9A3"))

            if let score = data?.readinessScore {
                Text("Readiness \(score)")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
            }

            if let workout = data?.todayWorkout {
                Text(workout)
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#0A0A0A"))
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b)
    }
}
