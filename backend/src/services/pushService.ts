/**
 * Serviciu de notificări push prin Expo.
 *
 * Trimiterea efectivă e best-effort: dacă rețeaua/Expo nu sunt disponibile,
 * eșecul e logat, nu aruncat (notificările nu trebuie să blocheze fluxul).
 * Construirea payload-ului stă în lib/notifications (pură, testată).
 */

import { prisma } from '../db.js';
import type { PushPayload } from '../lib/notifications.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Înregistrează (sau actualizează) un token de push pentru un utilizator. */
export async function registerToken(userId: string, token: string, platform = 'expo'): Promise<void> {
  await prisma.pushToken.upsert({
    where: { token },
    update: { userId, platform },
    create: { userId, token, platform },
  });
}

/** Trimite o notificare către toate device-urile unui utilizator. */
export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;
  await sendToTokens(
    tokens.map((t) => t.token),
    payload,
  );
}

/** Trimite către o listă de token-uri Expo. Eșecurile sunt înghițite (best-effort). */
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
    console.warn('Push eșuat (ignorat):', (err as Error).message);
  }
}
