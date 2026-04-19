import { VideoCallRoom } from '@/components/video-call-room';

export const metadata = {
  title: 'Videoconferência | MyFitLife',
};

export default async function VideoRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VideoCallRoom appointmentId={id} />;
}
