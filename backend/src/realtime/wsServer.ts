/**
 * WebSocket server attached to the HTTP server. Authenticates via JWT token
 * (query `?token=` or Authorization header) and manages group subscriptions.
 *
 * Protocol client -> server (JSON):
 *   { "action": "subscribe", "groupId": "..." }
 *   { "action": "unsubscribe", "groupId": "..." }
 * Server -> client: { "type": "...", "payload": ... }
 */

import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { verifyToken } from '../auth/auth.js';
import { hub, type Client } from './hub.js';

function extractToken(url: string | undefined, protocolHeader: string | undefined): string | null {
  if (url) {
    const parsed = new URL(url, 'http://localhost');
    const fromQuery = parsed.searchParams.get('token');
    if (fromQuery) return fromQuery;
  }
  if (protocolHeader?.startsWith('Bearer ')) return protocolHeader.slice('Bearer '.length).trim();
  return null;
}

export function attachWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, req) => {
    const token = extractToken(req.url, req.headers['authorization']);
    let userId: string;
    try {
      userId = verifyToken(token ?? '').sub;
    } catch {
      socket.close(4001, 'Not authenticated');
      return;
    }

    const client: Client = { socket, userId, groups: new Set() };
    hub.add(client);
    socket.send(JSON.stringify({ type: 'CONNECTED', payload: { userId } }));

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { action?: string; groupId?: string };
        if (msg.action === 'subscribe' && msg.groupId) client.groups.add(msg.groupId);
        else if (msg.action === 'unsubscribe' && msg.groupId) client.groups.delete(msg.groupId);
      } catch {
        // ignore malformed messages
      }
    });

    socket.on('close', () => hub.remove(client));
    socket.on('error', () => hub.remove(client));
  });

  return wss;
}
