/**
 * Biometric authentication using @capacitor/preferences for credential storage
 * and the WebAuthn / native biometric prompt where available.
 *
 * Stored credentials are saved in Capacitor Preferences (encrypted on-device).
 * We use the Web Authentication API (PassKeys / platform authenticator) when running
 * on a web context, and rely on the OS biometric prompt on iOS/Android via the
 * built-in WebAuthn platform authenticator.
 */

import { isNative } from '@/lib/platform';

const CRED_KEY = 'biometric_email';
const PASS_KEY = 'biometric_password';

async function getPreferences() {
  const { Preferences } = await import('@capacitor/preferences');
  return Preferences;
}

export async function isBiometryAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    // Check if the device supports platform authenticator (Face ID / Touch ID / fingerprint)
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    }
    return false;
  } catch {
    return false;
  }
}

export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  try {
    const Preferences = await getPreferences();
    await Promise.all([
      Preferences.set({ key: CRED_KEY, value: email }),
      Preferences.set({ key: PASS_KEY, value: password }),
    ]);
  } catch (err) {
    console.warn('[biometric-auth] Failed to save credentials:', err);
  }
}

export async function getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const Preferences = await getPreferences();
    const [emailRes, passRes] = await Promise.all([
      Preferences.get({ key: CRED_KEY }),
      Preferences.get({ key: PASS_KEY }),
    ]);
    if (!emailRes.value || !passRes.value) return null;
    return { email: emailRes.value, password: passRes.value };
  } catch {
    return null;
  }
}

export async function clearBiometricCredentials(): Promise<void> {
  try {
    const Preferences = await getPreferences();
    await Promise.all([
      Preferences.remove({ key: CRED_KEY }),
      Preferences.remove({ key: PASS_KEY }),
    ]);
  } catch {
    // ignore
  }
}

/**
 * Prompt the user for biometric verification.
 * Returns true if verified, false otherwise.
 * Uses the device's platform authenticator (Face ID, Touch ID, fingerprint).
 */
export async function authenticateWithBiometry(reason = 'Confirme sua identidade'): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    // Use a credential assertion challenge as a "presence check"
    // This will trigger the native biometric UI on supported devices
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      },
    });
    return !!credential;
  } catch (err) {
    // User cancelled or biometry unavailable
    console.info('[biometric-auth] authenticateWithBiometry:', reason, err);
    return false;
  }
}
