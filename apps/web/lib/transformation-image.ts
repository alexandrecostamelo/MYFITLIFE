import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FaceCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ProcessOptions = {
  anonymize: boolean;
  watermarkText: string;
  /** Face bounding boxes in original image pixel space */
  faces?: FaceCoord[];
  /** Original image dimensions (needed to scale coords after resize) */
  origWidth?: number;
  origHeight?: number;
};

async function fetchImageBuffer(supabase: SupabaseClient, bucket: string, path: string): Promise<Buffer> {
  const { data } = await supabase.storage.from(bucket).download(path);
  if (!data) throw new Error('image_not_found');
  return Buffer.from(await data.arrayBuffer());
}

function buildWatermarkSVG(width: number, height: number, text: string): string {
  const fontSize = Math.max(14, Math.round(width * 0.03));
  const padding = Math.round(width * 0.02);
  const y = height - padding;
  const badgeW = Math.round(fontSize * 4.2);
  const badgeH = Math.round(fontSize * 1.4);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="sh"><feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.6"/></filter>
    </defs>
    <text x="${width - padding}" y="${y}"
      font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
      fill="white" text-anchor="end" filter="url(#sh)" opacity="0.9">${text}</text>
    <rect x="${padding}" y="${padding}" width="${badgeW}" height="${badgeH}" rx="4" fill="rgba(0,0,0,0.55)"/>
    <text x="${padding + Math.round(fontSize * 0.5)}" y="${padding + Math.round(fontSize * 1.05)}"
      font-family="Arial, sans-serif" font-size="${Math.round(fontSize * 0.85)}" font-weight="bold"
      fill="white">MyFitLife</text>
  </svg>`;
}

function buildAnonymizeSVG(width: number, height: number): string {
  // Heuristic fallback: top-centre ellipse
  const cx = Math.round(width / 2);
  const cy = Math.round(height * 0.22);
  const rx = Math.round(width * 0.18);
  const ry = Math.round(height * 0.13);
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.85)"/>
  </svg>`;
}

function buildFaceMaskSVG(
  width: number,
  height: number,
  faces: FaceCoord[],
  origWidth: number,
  origHeight: number
): string {
  // Scale factor from original → processed dimensions
  const sx = origWidth > 0 ? width / origWidth : 1;
  const sy = origHeight > 0 ? height / origHeight : 1;

  const ellipses = faces.map((f) => {
    const cx = (f.x + f.width / 2) * sx;
    const cy = (f.y + f.height / 2) * sy;
    const rx = (f.width / 2) * sx * 1.15;
    const ry = (f.height / 2) * sy * 1.25;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.95)"/>`;
  }).join('');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${ellipses}</svg>`;
}

export async function processTransformationImage(
  supabase: SupabaseClient,
  sourceBucket: string,
  sourcePath: string,
  userId: string,
  label: 'before' | 'after',
  opts: ProcessOptions
): Promise<string> {
  const original = await fetchImageBuffer(supabase, sourceBucket, sourcePath);

  const base = sharp(original).rotate().resize(1200, 1200, { fit: 'inside' });
  const { width = 1200, height = 1200 } = await base.metadata();

  const overlays: sharp.OverlayOptions[] = [];

  if (opts.anonymize) {
    const hasFaces = opts.faces && opts.faces.length > 0 && opts.origWidth && opts.origHeight;
    const maskSvg = hasFaces
      ? buildFaceMaskSVG(width, height, opts.faces!, opts.origWidth!, opts.origHeight!)
      : buildAnonymizeSVG(width, height);
    overlays.push({ input: Buffer.from(maskSvg), top: 0, left: 0 });
  }

  overlays.push({ input: Buffer.from(buildWatermarkSVG(width, height, opts.watermarkText)), top: 0, left: 0 });

  const processedBuffer = await base.composite(overlays).jpeg({ quality: 88 }).toBuffer();

  const fileName = `${userId}/${Date.now()}-${label}.jpg`;
  const { error } = await supabase.storage
    .from('transformations-public')
    .upload(fileName, processedBuffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(error.message);

  return fileName;
}
