import { useEffect, useRef } from 'react';
import { WS_URL } from '../config';
import { getAuthToken } from '../api/client';

export interface RealtimeMessage {
  type: string;
  payload: unknown;
}

interface Options {
  /** Group to subscribe to (for NEW_ACTIVITY). */
  groupId?: string;
  /** Called on every message from the server. */
  onMessage: (msg: RealtimeMessage) => void;
}

/**
 * Live WebSocket connection to the backend. Reconnects automatically on disconnect.
 * Used for real-time price updates and feed events.
 */
export function useRealtime({ groupId, onMessage }: Options): void {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function connect() {
      socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token!)}`);

      socket.onopen = () => {
        if (groupId && socket) socket.send(JSON.stringify({ action: 'subscribe', groupId }));
      };
      socket.onmessage = (e) => {
        try {
          handlerRef.current(JSON.parse(typeof e.data === 'string' ? e.data : '') as RealtimeMessage);
        } catch {
          // ignore malformed messages
        }
      };
      socket.onclose = () => {
        if (!closed) reconnectTimer = setTimeout(connect, 2000);
      };
      socket.onerror = () => socket?.close();
    }

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [groupId]);
}
