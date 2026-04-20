import { registerPlugin } from '@capacitor/core';

export interface ShortcutsPlugin {
  donate(options: { type: string }): Promise<void>;
}

const Shortcuts = registerPlugin<ShortcutsPlugin>('Shortcuts');
export default Shortcuts;
