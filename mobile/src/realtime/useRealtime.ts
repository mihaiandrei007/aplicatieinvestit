import { useEffect, useRef } from 'react';
import { WS_URL } from '../config';
import { getAuthToken } from '../api/client';

export interface RealtimeMessage {
  type: string;
  payload: unknown;
}

interface Options {
  /** Grup la care să se aboneze (pentru NEW_ACTIVITY). */
  groupId?: string;
  /** Apelat la fiecare mesaj de la server. */
  onMessage: (msg: RealtimeMessage) => void;
}

/**
 * Conexiune WebSocket live la backend. Se reconectează automat la deconectare.
 * Folosit pentru actualizări de preț și evenimente de feed în timp real.
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
          // ignoră mesaje malformate
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
