import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveWidgetData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidgets", returnType: CAPPluginReturnPromise),
    ]

    @objc func saveWidgetData(_ call: CAPPluginCall) {
        guard let data = call.getString("data") else {
            call.reject("Missing data")
            return
        }
        let defaults = UserDefaults(suiteName: "group.app.myfitlife.shared")
        defaults?.set(data, forKey: "widgetData")
        defaults?.synchronize()
        call.resolve()
    }

    @objc func reloadWidgets(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}
