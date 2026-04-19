/**
 * Native camera utilities using @capacitor/camera.
 * Falls back gracefully on web.
 */

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
}

export async function captureNativePhoto(): Promise<CapturedPhoto | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch (err) {
    console.warn('[native-camera] captureNativePhoto failed:', err);
    return null;
  }
}

export async function pickFromGallery(): Promise<CapturedPhoto | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch (err) {
    console.warn('[native-camera] pickFromGallery failed:', err);
    return null;
  }
}
