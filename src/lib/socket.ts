import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'], // prefer websocket for lower latency
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function joinMatch(matchId: string) {
  const s = getSocket();
  s.emit('join-match', matchId);
}

export function leaveMatch(matchId: string) {
  const s = getSocket();
  s.emit('leave-match', matchId);
}

export function emitMatchUpdate(matchId: string, state: unknown) {
  const s = getSocket();
  s.emit('client-match-update', { matchId, state });
}

export function onMatchUpdate(callback: (data: { matchId: string; state: unknown }) => void) {
  const s = getSocket();
  s.on('match-update', callback);
  return () => { s.off('match-update', callback); };
}

export function onMatchCreated(callback: (state: unknown) => void) {
  const s = getSocket();
  s.on('match-created', callback);
  return () => { s.off('match-created', callback); };
}

export function onMatchesUpdated(callback: () => void) {
  const s = getSocket();
  s.on('matches-updated', callback);
  return () => { s.off('matches-updated', callback); };
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
