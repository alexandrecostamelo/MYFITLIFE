import Capacitor

@objc(ShortcutsPlugin)
public class ShortcutsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShortcutsPlugin"
    public let jsName = "Shortcuts"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "donate", returnType: CAPPluginReturnPromise),
    ]

    @objc func donate(_ call: CAPPluginCall) {
        guard let type = call.getString("type") else {
            call.reject("Missing type")
            return
        }
        ShortcutsManager.shared.donateShortcut(type)
        call.resolve()
    }
}
