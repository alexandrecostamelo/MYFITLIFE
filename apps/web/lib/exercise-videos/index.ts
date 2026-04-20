export interface ExerciseVideo {
  id: string;
  exercise_id: string;
  video_type: 'front' | 'side' | 'mistakes' | 'setup';
  storage_path: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
}

export function getVideoUrl(video: ExerciseVideo): string | null {
  if (video.storage_path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/exercise-videos/${video.storage_path}`;
  }
  if (video.youtube_id) {
    return `https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1&playsinline=1`;
  }
  return null;
}

export function getThumbnailUrl(video: ExerciseVideo): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  if (video.youtube_id) return `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
  return null;
}

export function videoTypeLabel(type: ExerciseVideo['video_type']): string {
  const map: Record<string, string> = {
    front: 'Vista frontal',
    side: 'Vista lateral',
    mistakes: 'Erros comuns',
    setup: 'Setup',
  };
  return map[type] || type;
}
