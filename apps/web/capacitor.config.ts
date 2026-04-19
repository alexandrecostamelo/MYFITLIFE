import type { CapacitorConfig } from '@capacitor/cli';

// In production builds the app loads from the live Vercel deployment.
// Set CAPACITOR_DEV_SERVER_URL to your local Next.js dev URL during development.
const devUrl = process.env['CAPACITOR_DEV_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'com.myfitlife.app',
  appName: 'MyFitLife',
  webDir: 'out',
  server: {
    // Point to live production URL so API routes and SSR work in the native shell.
    // Override with CAPACITOR_DEV_SERVER_URL=http://<your-ip>:3000 for local dev.
    url: devUrl || 'https://myfitlife.app',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
    },
  },
};

export default config;
