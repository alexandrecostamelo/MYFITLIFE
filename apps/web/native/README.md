# Native Widget Code — MyFitLife

Este diretório contém código nativo que deve ser copiado para os projetos
iOS/Android após rodar `npx cap add ios` / `npx cap add android`.

## iOS

### 1. Copiar plugin WidgetBridge
Copie `ios/WidgetBridge/WidgetBridgePlugin.swift` para `ios/App/App/`.

### 2. Criar Widget Extension
No Xcode: File → New → Target → Widget Extension → "MyFitLifeWidget".
Substitua o conteúdo gerado pelo arquivo `ios/MyFitLifeWidget/MyFitLifeWidget.swift`.

### 3. Configurar App Group
Ambos os targets (App e MyFitLifeWidget) precisam do capability:
- Signing & Capabilities → + App Groups → `group.app.myfitlife.shared`

### 4. Registrar plugin
No `AppDelegate.swift` ou `capacitor.config.ts`, o Capacitor detecta
automaticamente plugins Swift no target principal.

## Android

### 1. Copiar arquivos
```
android/widget/MyFitLifeWidget.kt    → android/app/src/main/java/app/myfitlife/widget/
android/plugins/WidgetBridgePlugin.kt → android/app/src/main/java/app/myfitlife/plugins/
android/res/layout/widget_medium.xml  → android/app/src/main/res/layout/
android/res/xml/widget_info.xml       → android/app/src/main/res/xml/
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
