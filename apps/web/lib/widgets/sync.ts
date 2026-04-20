import { Capacitor } from '@capacitor/core';
import WidgetBridge from '@/plugins/widget-bridge';

export interface WidgetData {
  streak: number;
  todayWorkout: string | null;
  todayWorkoutDone: boolean;
  todayMinutes: number;
  nextMeal: string | null;
  nextMealTime: string | null;
  mealsLogged: number;
  mealsTarget: number;
  checkinDone: boolean;
  readinessScore: number | null;
  readinessZone: string | null;
  sleepScore: number | null;
  updatedAt: string;
}

export async function syncWidgetData(data: WidgetData): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetBridge.saveWidgetData({ data: JSON.stringify(data) });
    await WidgetBridge.reloadWidgets();
  } catch (err) {
    console.error('widget sync failed:', err);
  }
}
