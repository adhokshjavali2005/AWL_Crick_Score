import { Server as SocketServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketServer;

export function initSocket(server: HTTPServer, frontendUrl: string) {
  io = new SocketServer(server, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a match room to receive live updates
    socket.on('join-match', (matchId: string) => {
      socket.join(`match:${matchId}`);
      console.log(`[Socket] ${socket.id} joined match:${matchId}`);
    });

    // Leave a match room
    socket.on('leave-match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      console.log(`[Socket] ${socket.id} left match:${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcast match state update to all clients watching a match.
 */
export function broadcastMatchUpdate(matchId: string, matchState: unknown) {
  if (io) {
    io.to(`match:${matchId}`).emit('match-update', { matchId, state: matchState });
  }
}

/**
 * Broadcast that a new match was created (for live matches list).
 */
export function broadcastMatchCreated(matchState: unknown) {
  if (io) {
    io.emit('match-created', matchState);
  }
}

/**
 * Broadcast that a match list should be refreshed.
 */
export function broadcastMatchListUpdate() {
  if (io) {
    io.emit('matches-updated');
  }
}

export { io };
