# Native Code — MyFitLife

Este diretório contém código nativo (widgets + shortcuts) que deve ser
copiado para os projetos iOS/Android após `npx cap add ios` / `npx cap add android`.

## iOS

### 1. Copiar plugin WidgetBridge
Copie `ios/WidgetBridge/WidgetBridgePlugin.swift` para `ios/App/App/`.

### 2. Criar Widget Extension
No Xcode: File → New → Target → Widget Extension → "MyFitLifeWidget".
Substitua o conteúdo gerado pelo arquivo `ios/MyFitLifeWidget/MyFitLifeWidget.swift`.

### 3. Configurar App Group
Ambos os targets (App e MyFitLifeWidget) precisam do capability:
- Signing & Capabilities → + App Groups → `group.app.myfitlife.shared`

### 4. Registrar plugin WidgetBridge
O Capacitor detecta automaticamente plugins Swift no target principal.

### 5. Copiar Siri Shortcuts
Copie `ios/Shortcuts/ShortcutsManager.swift` e `ios/Shortcuts/ShortcutsPlugin.swift`
para `ios/App/App/`.

### 6. Registrar NSUserActivityTypes no Info.plist
Adicione dentro de `<dict>`:
```xml
<key>NSUserActivityTypes</key>
<array>
    <string>app.myfitlife.log-meal</string>
    <string>app.myfitlife.start-workout</string>
    <string>app.myfitlife.checkin</string>
    <string>app.myfitlife.coach</string>
    <string>app.myfitlife.readiness</string>
</array>
```

### 7. Doar shortcuts e handler no AppDelegate.swift
```swift
// Em didFinishLaunchingWithOptions:
ShortcutsManager.shared.donateAllShortcuts()

// Handler de activity:
func application(_ application: UIApplication, continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    if let path = userActivity.userInfo?["path"] as? String {
        bridge?.webView?.evaluateJavaScript("window.location.href = '\(path)'")
    }
    return true
}
```

## Android

### 1. Copiar arquivos
```
android/widget/MyFitLifeWidget.kt          → android/app/src/main/java/app/myfitlife/widget/
android/plugins/WidgetBridgePlugin.kt       → android/app/src/main/java/app/myfitlife/plugins/
android/res/layout/widget_medium.xml        → android/app/src/main/res/layout/
android/res/xml/widget_info.xml             → android/app/src/main/res/xml/
android/res/xml/shortcuts.xml               → android/app/src/main/res/xml/
android/res/values/shortcuts_strings.xml    → android/app/src/main/res/values/
```

### 2. Registrar widget no AndroidManifest.xml
Adicione dentro de `<application>`:
```xml
<receiver android:name=".widget.MyFitLifeWidget" android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_info" />
</receiver>
```

### 3. Registrar plugin no MainActivity.kt
```kotlin
import app.myfitlife.plugins.WidgetBridgePlugin

// No onCreate:
registerPlugin(WidgetBridgePlugin::class.java)
```

### 4. Registrar shortcuts no AndroidManifest.xml
Dentro da `<activity>` principal, adicione:
```xml
<meta-data
    android:name="android.app.shortcuts"
    android:resource="@xml/shortcuts" />
```
