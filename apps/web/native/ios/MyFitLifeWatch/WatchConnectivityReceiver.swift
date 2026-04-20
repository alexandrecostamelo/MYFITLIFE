import WatchConnectivity
import WidgetKit

class WatchReceiver: NSObject, WCSessionDelegate {
    static let shared = WatchReceiver()

    func activate() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        if let json = applicationContext["widgetData"] as? String {
            let defaults = UserDefaults(suiteName: "group.app.myfitlife.shared")
            defaults?.set(json, forKey: "widgetData")
            defaults?.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}
}
