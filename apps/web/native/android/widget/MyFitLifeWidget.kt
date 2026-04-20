package app.myfitlife.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import app.myfitlife.R
import org.json.JSONObject

class MyFitLifeWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs =
                context.getSharedPreferences("myfitlife_widget", Context.MODE_PRIVATE)
            val jsonStr = prefs.getString("widgetData", null)

            val views = RemoteViews(context.packageName, R.layout.widget_medium)

            // Tap opens the app
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://myfitlife.app/app/dashboard"))
            intent.setPackage(context.packageName)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            if (jsonStr != null) {
                try {
                    val data = JSONObject(jsonStr)
                    val streak = data.optInt("streak", 0)
                    val workout = data.optString("todayWorkout", "")
                    val workoutDone = data.optBoolean("todayWorkoutDone", false)
                    val minutes = data.optInt("todayMinutes", 0)
                    val meals = data.optInt("mealsLogged", 0)
                    val mealsTarget = data.optInt("mealsTarget", 4)
                    val checkinDone = data.optBoolean("checkinDone", false)
                    val readiness = data.optInt("readinessScore", -1)

                    views.setTextViewText(R.id.streak_text, "\uD83D\uDD25 $streak")
                    views.setTextViewText(
                        R.id.workout_text,
                        if (workoutDone) "\u2705 $workout" else "\u25CB $workout"
                    )
                    views.setTextViewText(
                        R.id.checkin_text,
                        if (checkinDone) "\u2705 Check-in" else "\u25CB Check-in matinal"
                    )
                    views.setTextViewText(
                        R.id.stats_text,
                        "\uD83E\uDD57 $meals/$mealsTarget  \u23F1 ${minutes}min"
                    )
                    if (readiness >= 0) {
                        views.setTextViewText(R.id.readiness_text, "Readiness $readiness")
                        views.setViewVisibility(R.id.readiness_text, android.view.View.VISIBLE)
                    }
                } catch (e: Exception) {
                    views.setTextViewText(R.id.streak_text, "MyFitLife")
                    views.setTextViewText(R.id.workout_text, "Abra o app pra sincronizar")
                }
            } else {
                views.setTextViewText(R.id.streak_text, "MyFitLife")
                views.setTextViewText(R.id.workout_text, "Abra o app pra sincronizar")
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
