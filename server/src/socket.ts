import { Server as SocketServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketServer;

export function initSocket(server: HTTPServer, frontendUrl: string) {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow configured frontend, any vercel.app, and localhost
        if (!origin || origin === frontendUrl || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(null, true); // permissive for now
        }
      },
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

    // Client-side live update: admin pushes state directly via socket for instant spectator updates
    // This is faster than waiting for the API round-trip
    socket.on('client-match-update', (data: { matchId: string; state: unknown }) => {
      // Broadcast to ALL other clients (not back to the sender) — covers both room members and LiveMatches viewers
      socket.broadcast.emit('match-update', { matchId: data.matchId, state: data.state });
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
