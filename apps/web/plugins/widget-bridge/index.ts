import { registerPlugin } from '@capacitor/core';

export interface WidgetBridgePlugin {
  saveWidgetData(options: { data: string }): Promise<void>;
  reloadWidgets(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');
export default WidgetBridge;
