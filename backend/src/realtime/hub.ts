/**
 * Real-time hub: keeps the WebSocket connections and broadcasts messages
 * to groups or to a user. Standalone module (no imports from routes),
 * so it can be called from any service without cycles.
 */

import type { WebSocket } from 'ws';

export interface Client {
  socket: WebSocket;
  userId: string;
  /** The groups the client is subscribed to. */
  groups: Set<string>;
}

export interface RealtimeMessage {
  type: string;
  payload: unknown;
}

class RealtimeHub {
  private clients = new Set<Client>();

  add(client: Client): void {
    this.clients.add(client);
  }

  remove(client: Client): void {
    this.clients.delete(client);
  }

  /** How many clients are connected (useful for tests/monitoring). */
  get size(): number {
    return this.clients.size;
  }

  /** Sends to all clients subscribed to a group. */
  broadcastToGroup(groupId: string, message: RealtimeMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.groups.has(groupId)) this.safeSend(client, data);
    }
  }

  /** Sends to all of a user's connections (they may have multiple devices). */
  sendToUser(userId: string, message: RealtimeMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.userId === userId) this.safeSend(client, data);
    }
  }

  /** Broadcasts to everyone (e.g. global market price updates). */
  broadcastAll(message: RealtimeMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) this.safeSend(client, data);
  }

  private safeSend(client: Client, data: string): void {
    if (client.socket.readyState === client.socket.OPEN) {
      client.socket.send(data);
    }
  }
}

/** Shared in-process singleton. */
export const hub = new RealtimeHub();
