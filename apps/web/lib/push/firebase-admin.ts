import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let app: App | null = null;
let messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging {
  if (messaging) return messaging;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');

  const json = Buffer.from(base64, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(json);

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
  } else {
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  messaging = getMessaging(app);
  return messaging;
}
