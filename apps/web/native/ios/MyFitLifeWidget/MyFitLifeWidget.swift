import WidgetKit
import SwiftUI

// MARK: - Data Model

struct WidgetData: Codable {
    let streak: Int
    let todayWorkout: String?
    let todayWorkoutDone: Bool
    let todayMinutes: Int
    let mealsLogged: Int
    let mealsTarget: Int
    let checkinDone: Bool
    let readinessScore: Int?
    let readinessZone: String?
    let sleepScore: Int?
    let updatedAt: String
}

// MARK: - Timeline Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let data = loadData()
        completion(SimpleEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let data = loadData()
        let entry = SimpleEntry(date: Date(), data: data)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadData() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: "group.app.myfitlife.shared"),
              let jsonString = defaults.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetData.self, from: jsonData)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

// MARK: - Small Widget (Streak + Readiness)

struct SmallWidgetView: View {
    let data: WidgetData?

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("\u{1F525}")
                Text("\(data?.streak ?? 0)")
                    .font(.system(size: 32, weight: .light, design: .monospaced))
                    .foregroundColor(Color(hex: "#00D9A3"))
            }
            Text("STREAK")
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(.gray)
                .tracking(2)
            if let score = data?.readinessScore {
                HStack(spacing: 4) {
                    Circle()
                        .fill(zoneColor(data?.readinessZone))
                        .frame(width: 6, height: 6)
                    Text("\(score)")
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#0A0A0A"))
    }

    func zoneColor(_ zone: String?) -> Color {
        switch zone {
        case "green": return Color(hex: "#00D9A3")
        case "yellow": return Color(hex: "#FFD93D")
        case "red": return Color(hex: "#FF5C5C")
        default: return .gray
        }
    }
}

// MARK: - Medium Widget (Workout + Checkin + Meals)

struct MediumWidgetView: View {
    let data: WidgetData?

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("\u{1F525} \(data?.streak ?? 0)")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(Color(hex: "#00D9A3"))
                    Spacer()
                    if let score = data?.readinessScore {
                        Text("\(score)")
                            .font(.system(size: 14, weight: .light, design: .monospaced))
                            .foregroundColor(zoneColor(data?.readinessZone))
                    }
                }

                if let workout = data?.todayWorkout {
                    HStack(spacing: 4) {
                        Image(systemName: data?.todayWorkoutDone == true ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(data?.todayWorkoutDone == true ? Color(hex: "#00D9A3") : .gray)
                            .font(.system(size: 12))
                        Text(workout)
                            .font(.system(size: 12))
                            .foregroundColor(.white)
                            .lineLimit(1)
                    }
                }

                HStack(spacing: 4) {
                    Image(systemName: data?.checkinDone == true ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(data?.checkinDone == true ? Color(hex: "#00D9A3") : .gray)
                        .font(.system(size: 12))
                    Text("Check-in matinal")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.7))
                }

                HStack(spacing: 4) {
                    Text("\u{1F957} \(data?.mealsLogged ?? 0)/\(data?.mealsTarget ?? 4)")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.5))
                    Text("\u{23F1} \(data?.todayMinutes ?? 0)min")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            .padding(.leading, 4)
            Spacer()
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#0A0A0A"))
    }

    func zoneColor(_ zone: String?) -> Color {
        switch zone {
        case "green": return Color(hex: "#00D9A3")
        case "yellow": return Color(hex: "#FFD93D")
        case "red": return Color(hex: "#FF5C5C")
        default: return .gray
        }
    }
}

// MARK: - Widget Configuration

@main
struct MyFitLifeWidget: Widget {
    let kind: String = "MyFitLifeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                WidgetEntryView(entry: entry)
                    .containerBackground(Color(hex: "#0A0A0A"), for: .widget)
            } else {
                WidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("MyFitLife")
        .description("Seu plano do dia na home")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct WidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: SimpleEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        default:
            MediumWidgetView(data: entry.data)
        }
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
