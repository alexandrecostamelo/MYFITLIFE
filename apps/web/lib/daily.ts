const DAILY_API = 'https://api.daily.co/v1';

function authHeaders() {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error('DAILY_API_KEY not configured');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export type CreateRoomOptions = {
  name: string;
  expiresAt: Date;
  enableRecording?: boolean;
  maxParticipants?: number;
};

export async function createDailyRoom(opts: CreateRoomOptions): Promise<{ url: string; name: string }> {
  const expUnix = Math.floor(opts.expiresAt.getTime() / 1000);

  const body: Record<string, unknown> = {
    name: opts.name,
    privacy: 'private',
    properties: {
      exp: expUnix,
      max_participants: opts.maxParticipants || 5,
      enable_prejoin_ui: true,
      enable_screenshare: true,
      enable_chat: true,
      enable_network_ui: true,
      enable_people_ui: true,
      start_video_off: false,
      start_audio_off: false,
      lang: 'pt-BR',
      ...(opts.enableRecording ? { enable_recording: 'cloud' } : {}),
    },
  };

  const res = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 400 && err.includes('already')) {
      return getDailyRoom(opts.name);
    }
    throw new Error(`Daily create room failed: ${err}`);
  }

  const data = await res.json();
  return { url: data.url as string, name: data.name as string };
}

export async function getDailyRoom(name: string): Promise<{ url: string; name: string }> {
  const res = await fetch(`${DAILY_API}/rooms/${name}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Daily get room failed: ${await res.text()}`);
  const data = await res.json();
  return { url: data.url as string, name: data.name as string };
}

export async function deleteDailyRoom(name: string): Promise<void> {
  await fetch(`${DAILY_API}/rooms/${name}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export type CreateTokenOptions = {
  roomName: string;
  userName: string;
  userId: string;
  isOwner?: boolean;
  expiresAt: Date;
};

export async function createDailyToken(opts: CreateTokenOptions): Promise<string> {
  const expUnix = Math.floor(opts.expiresAt.getTime() / 1000);

  const body = {
    properties: {
      room_name: opts.roomName,
      user_name: opts.userName,
      user_id: opts.userId,
      is_owner: !!opts.isOwner,
      exp: expUnix,
    },
  };

  const res = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Daily token creation failed: ${await res.text()}`);
  const data = await res.json();
  return data.token as string;
}
