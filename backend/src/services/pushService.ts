/**
 * Push notification service via Expo.
 *
 * The actual sending is best-effort: if the network/Expo are unavailable, the
 * failure is logged, not thrown (notifications must not block the flow).
 * Building the payload lives in lib/notifications (pure, tested).
 */

import { prisma } from '../db.js';
import type { PushPayload } from '../lib/notifications.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Registers (or updates) a push token for a user. */
export async function registerToken(userId: string, token: string, platform = 'expo'): Promise<void> {
  await prisma.pushToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });
}

/** Sends a notification to all of a user's devices. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;
  await sendToTokens(
    tokens.map((t) => t.token),
    payload,
  );
}

/** Sends to a list of Expo tokens. Failures are swallowed (best-effort). */
export async function sendToTokens(tokens: readonly string[], payload: PushPayload): Promise<void> {
  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  }));
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn('Push failed (ignored):', (err as Error).message);
  }
}
