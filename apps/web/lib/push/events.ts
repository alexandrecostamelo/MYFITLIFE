import { sendPushToUser } from './send';
import { createClient } from '@supabase/supabase-js';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function getName(userId: string): Promise<string> {
  const { data } = await admin()
    .from('profiles')
    .select('full_name, username')
    .eq('id', userId)
    .single();
  const d = data as { full_name?: string; username?: string } | null;
  return d?.full_name?.split(' ')[0] || d?.username || 'alguém';
}

export async function notifyFriendRequest(requesterId: string, targetId: string) {
  const name = await getName(requesterId);
  await sendPushToUser(targetId, 'friend_request', {
    title: 'Novo pedido de amizade',
    body: `${name} quer te adicionar no MyFitLife`,
    link: '/app/friends/requests',
    data: { requester_id: requesterId },
  });
}

export async function notifyFriendWorkout(friendId: string, workerId: string, workoutName: string) {
  const name = await getName(workerId);
  await sendPushToUser(friendId, 'friend_workout', {
    title: `${name} acabou de treinar`,
    body: workoutName || 'Confira no feed',
    link: `/app/friends/${workerId}`,
    data: { worker_id: workerId },
  });
}

export async function notifyChallengeInvite(
  inviterId: string,
  targetId: string,
  challengeId: string,
  challengeName: string
) {
  const name = await getName(inviterId);
  await sendPushToUser(targetId, 'challenge_invite', {
    title: `${name} te desafiou`,
    body: challengeName,
    link: `/app/challenges/${challengeId}`,
    data: { challenge_id: challengeId, inviter_id: inviterId },
  });
}

export async function notifyChatMessage(
  senderId: string,
  recipientId: string,
  threadId: string,
  preview: string
) {
  const name = await getName(senderId);
  await sendPushToUser(recipientId, 'chat_message', {
    title: name,
    body: preview.slice(0, 100),
    link: `/app/threads/${threadId}`,
    data: { thread_id: threadId, sender_id: senderId },
  });
}

export async function notifyFriendAchievement(
  friendId: string,
  achieverId: string,
  achievement: string
) {
  const name = await getName(achieverId);
  await sendPushToUser(friendId, 'friend_achievement', {
    title: `${name} conquistou algo!`,
    body: achievement,
    link: `/app/friends/${achieverId}`,
    data: { achiever_id: achieverId },
  });
}
