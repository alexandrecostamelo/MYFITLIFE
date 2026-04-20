import WatchConnectivity

/// Manages WatchConnectivity from the iPhone side.
/// Sends widget data to the Apple Watch via applicationContext.
/// Call `activate()` in AppDelegate.didFinishLaunchingWithOptions.
/// Call `sendDataToWatch()` after saving widget data (e.g. in WidgetBridgePlugin).
class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()

    func activate() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    func sendDataToWatch() {
        guard WCSession.default.isPaired,
              WCSession.default.isWatchAppInstalled else { return }
        guard let defaults = UserDefaults(suiteName: "group.app.myfitlife.shared"),
              let json = defaults.string(forKey: "widgetData") else { return }
        try? WCSession.default.updateApplicationContext(["widgetData": json])
    }

    // MARK: - WCSessionDelegate

    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {}

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
}
