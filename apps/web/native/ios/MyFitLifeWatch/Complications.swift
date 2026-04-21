import WidgetKit
import SwiftUI

// MARK: - Watch App (standalone view)

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

// MARK: - Timeline Provider

struct WatchProvider: TimelineProvider {
    func placeholder(in context: Context) -> WatchEntry {
        WatchEntry(date: Date(), data: WatchData.placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (WatchEntry) -> Void) {
        completion(WatchEntry(date: Date(), data: WatchData.load() ?? WatchData.placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WatchEntry>) -> Void) {
        let data = WatchData.load() ?? WatchData.placeholder
        let entry = WatchEntry(date: Date(), data: data)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct WatchEntry: TimelineEntry {
    let date: Date
    let data: WatchData
}

// MARK: - Streak Complication (Circular Small)

struct StreakComplication: Widget {
    let kind = "StreakComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WatchProvider()) { entry in
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 2) {
                    Text("\u{1F525}")
                        .font(.system(size: 14))
                    Text("\(entry.data.streak)")
                        .font(.system(size: 20, weight: .light, design: .monospaced))
                        .foregroundColor(Color(hex: "#00D9A3"))
                }
            }
        }
        .configurationDisplayName("Streak")
        .description("Dias consecutivos treinando")
        .supportedFamilies([.accessoryCircular, .accessoryCorner])
    }
}

// MARK: - Readiness Complication (Gauge)

struct ReadinessComplication: Widget {
    let kind = "ReadinessComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WatchProvider()) { entry in
            Gauge(value: Double(entry.data.readinessScore), in: 0...100) {
                Text("R")
            } currentValueLabel: {
                Text("\(entry.data.readinessScore)")
                    .font(.system(size: 16, weight: .light, design: .monospaced))
            }
            .gaugeStyle(.accessoryCircular)
            .tint(zoneGradient(entry.data.readinessZone))
        }
        .configurationDisplayName("Readiness")
        .description("Score de recuperação do corpo")
        .supportedFamilies([.accessoryCircular])
    }

    func zoneGradient(_ zone: String) -> Gradient {
        switch zone {
        case "green":
            return Gradient(colors: [Color(hex: "#00D9A3"), Color(hex: "#00B386")])
        case "yellow":
            return Gradient(colors: [Color(hex: "#FFD93D"), Color(hex: "#FFA726")])
        case "red":
            return Gradient(colors: [Color(hex: "#FF5C5C"), Color(hex: "#E53935")])
        default:
            return Gradient(colors: [.gray, .gray])
        }
    }
}

// MARK: - Workout Complication (Rectangular/Inline)

struct WorkoutComplication: Widget {
    let kind = "WorkoutComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WatchProvider()) { entry in
            VStack(alignment: .leading, spacing: 2) {
                if let workout = entry.data.todayWorkout {
                    HStack(spacing: 4) {
                        Image(systemName: entry.data.todayWorkoutDone
                            ? "checkmark.circle.fill"
                            : "dumbbell.fill")
                            .foregroundColor(entry.data.todayWorkoutDone
                                ? Color(hex: "#00D9A3")
                                : .white)
                            .font(.system(size: 10))
                        Text(workout)
                            .font(.system(size: 11))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                    Text("\(entry.data.todayMinutes)min hoje")
                        .font(.system(size: 9))
                        .foregroundColor(.gray)
                } else {
                    Text("Sem treino")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                }
            }
        }
        .configurationDisplayName("Treino do Dia")
        .description("Próximo treino e minutos")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Widget Bundle

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

struct MyFitLifeWatchWidgets: WidgetBundle {
    var body: some Widget {
        StreakComplication()
        ReadinessComplication()
        WorkoutComplication()
    }
}

// MARK: - Color Extension

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
