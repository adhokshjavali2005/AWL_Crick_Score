import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/teams — List all team names
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [canonicalTeams, storedTeams] = await Promise.all([
      prisma.team.findMany({
        orderBy: { name: 'asc' },
        select: { name: true },
      }),
      prisma.teamsStore.findMany({
        orderBy: { teamName: 'asc' },
        select: { teamName: true },
      }),
    ]);
    const names = Array.from(new Set([
      ...canonicalTeams.map(t => t.name),
      ...storedTeams.map(t => t.teamName),
    ])).sort((a, b) => a.localeCompare(b));
    res.json(names);
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
    const [team, mirroredTeam] = await Promise.all([
      prisma.teamPlayers.findUnique({
        where: { teamName },
      }),
      prisma.teamsStore.findUnique({
        where: { teamName },
      }),
    ]);
    res.json(team?.players || mirroredTeam?.players || []);
  } catch (error) {
    console.error('Error getting team players:', error);
    res.status(500).json({ error: 'Failed to get team players' });
  }
});

/**
 * PUT /api/teams/:name/players — Save/update players for a team (auth required)
 */
router.put('/:name/players', requireAuth, async (req: Request, res: Response) => {
  try {
    const teamName = (req.params.name as string).trim();
    const { players } = req.body;
    if (!teamName) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }
    if (!Array.isArray(players)) {
      res.status(400).json({ error: 'Players array is required' });
      return;
    }

    const playerNames = players
      .map((p: unknown) => {
        if (!p || typeof p !== 'object') return '';
        const name = (p as { name?: unknown }).name;
        return typeof name === 'string' ? name.trim() : '';
      })
      .filter((name): name is string => Boolean(name));

    await prisma.team.upsert({
      where: { name: teamName },
      create: { name: teamName },
      update: {},
    });

    const team = await prisma.teamPlayers.upsert({
      where: { teamName },
      create: {
        teamName,
        players: players,
        playerNames,
      },
      update: {
        players: players,
        playerNames,
      },
    });

    await prisma.teamsStore.upsert({
      where: { teamName },
      create: {
        teamName,
        players,
        playerNames,
      },
      update: {
        players,
        playerNames,
      },
    });

    res.json(team.players);
  } catch (error) {
    console.error('Error saving team players:', error);
    res.status(500).json({ error: 'Failed to save team players' });
  }
});

export default router;
