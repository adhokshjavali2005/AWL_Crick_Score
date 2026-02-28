import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/teams — List all team names
 */
router.get('/', async (_req, res) => {
  try {
    const teams = await prisma.teamPlayers.findMany({
      orderBy: { teamName: 'asc' },
      select: { teamName: true },
    });
    res.json(teams.map(t => t.teamName));
  } catch (error) {
    console.error('Error listing teams:', error);
    res.status(500).json({ error: 'Failed to list teams' });
  }
});

/**
 * GET /api/teams/:name/players — Get players for a team
 */
router.get('/:name/players', async (req, res) => {
  try {
    const teamName = req.params.name as string;
    const team = await prisma.teamPlayers.findUnique({
      where: { teamName },
    });
    res.json(team?.players || []);
  } catch (error) {
    console.error('Error getting team players:', error);
    res.status(500).json({ error: 'Failed to get team players' });
  }
});

/**
 * PUT /api/teams/:name/players — Save/update players for a team (auth required)
 */
router.put('/:name/players', requireAuth, async (req, res) => {
  try {
    const teamName = req.params.name as string;
    const { players } = req.body;
    if (!Array.isArray(players)) {
      res.status(400).json({ error: 'Players array is required' });
      return;
    }

    const team = await prisma.teamPlayers.upsert({
      where: { teamName },
      create: {
        teamName,
        players: players,
      },
      update: {
        players: players,
      },
    });

    res.json(team.players);
  } catch (error) {
    console.error('Error saving team players:', error);
    res.status(500).json({ error: 'Failed to save team players' });
  }
});

export default router;
