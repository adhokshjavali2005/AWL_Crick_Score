import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import matchesRouter from './routes/matches.js';
import teamsRouter from './routes/teams.js';
import profileRouter from './routes/profile.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/profile', profileRouter);

// Initialize Socket.io
initSocket(server, FRONTEND_URL);

// Start server
server.listen(PORT, () => {
  console.log(`🏏 CricLive server running on port ${PORT}`);
  console.log(`   CORS origin: ${FRONTEND_URL}`);
});

export default app;
