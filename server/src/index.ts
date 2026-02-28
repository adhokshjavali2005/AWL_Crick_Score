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

// Build list of allowed origins
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain or listed origins
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, true); // permissive for now
  },
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

// Initialize Socket.io (allow vercel.app + configured frontend)
initSocket(server, FRONTEND_URL);

// Start server
server.listen(PORT, () => {
  console.log(`🏏 CricLive server running on port ${PORT}`);
  console.log(`   CORS origin: ${FRONTEND_URL}`);
});

export default app;
