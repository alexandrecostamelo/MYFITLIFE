package app.myfitlife.plugins

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import app.myfitlife.widget.MyFitLifeWidget

@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    @PluginMethod
    fun saveWidgetData(call: PluginCall) {
        val data = call.getString("data") ?: return call.reject("Missing data")
        val prefs = context.getSharedPreferences("myfitlife_widget", Context.MODE_PRIVATE)
        prefs.edit().putString("widgetData", data).apply()
        call.resolve()
    }

    @PluginMethod
    fun reloadWidgets(call: PluginCall) {
        val manager = AppWidgetManager.getInstance(context)
        val component = ComponentName(context, MyFitLifeWidget::class.java)
        val ids = manager.getAppWidgetIds(component)
        for (id in ids) {
            MyFitLifeWidget.updateAppWidget(context, manager, id)
        }
        call.resolve()
    }
}
