/**
 * Hub de timp real: păstrează conexiunile WebSocket și difuzează mesaje
 * pe grupuri sau pe utilizator. Modul standalone (fără import-uri din rute),
 * ca să fie apelabil din orice serviciu fără cicluri.
 */

import type { WebSocket } from 'ws';

export interface Client {
  socket: WebSocket;
  userId: string;
  /** Grupurile la care e abonat clientul. */
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

  /** Câți clienți sunt conectați (util pt. teste/monitorizare). */
  get size(): number {
    return this.clients.size;
  }

  /** Trimite tuturor clienților abonați la un grup. */
  broadcastToGroup(groupId: string, message: RealtimeMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.groups.has(groupId)) this.safeSend(client, data);
    }
  }

  /** Trimite tuturor conexiunilor unui utilizator (poate avea mai multe device-uri). */
  sendToUser(userId: string, message: RealtimeMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.userId === userId) this.safeSend(client, data);
    }
  }

  /** Difuzează tuturor (ex. actualizări de preț ale pieței globale). */
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

/** Singleton partajat în proces. */
export const hub = new RealtimeHub();
