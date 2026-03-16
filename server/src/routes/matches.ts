import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { requireAuth, optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { broadcastMatchUpdate, broadcastMatchCreated, broadcastMatchListUpdate } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();
let teamsTableReadyPromise: Promise<void> | null = null;

function extractTeamName(team: unknown): string {
  if (!team || typeof team !== 'object') return '';
  const name = (team as { name?: unknown }).name;
  return typeof name === 'string' ? name : '';
}

async function ensureTeamsTableShape() {
  if (!teamsTableReadyPromise) {
    teamsTableReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Teams" (
          "id" TEXT NOT NULL,
          "teamName" TEXT NOT NULL,
          "players" JSONB NOT NULL,
          "playerNames" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Teams_teamName_key" ON "Teams"("teamName")
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Teams"
        ADD COLUMN IF NOT EXISTS "playerNames" JSONB NOT NULL DEFAULT '[]'::jsonb
      `);
    })().catch((error) => {
      teamsTableReadyPromise = null;
      throw error;
    });
  }

  await teamsTableReadyPromise;
}

async function ensureTeamsExist(teamNames: string[]) {
  await ensureTeamsTableShape();
  const names = Array.from(new Set(teamNames.map(n => n.trim()).filter(Boolean)));
  if (names.length === 0) return;

  for (const name of names) {
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Teams" ("id", "teamName", "players", "playerNames", "updatedAt")
      VALUES (${id}, ${name}, ${JSON.stringify([])}::jsonb, ${JSON.stringify([])}::jsonb, NOW())
      ON CONFLICT ("teamName")
      DO UPDATE SET
        "updatedAt" = NOW()
    `;
  }
}

/**
 * GET /api/matches — List active matches (public)
 */
router.get('/', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: { in: ['setup', 'live', 'paused', 'inningsBreak', 'ended'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        state: true,
        status: true,
        teamAName: true,
        teamBName: true,
        updatedAt: true,
      },
    });
    res.json(matches);
  } catch (error) {
    console.error('Error listing matches:', error);
    res.status(500).json({ error: 'Failed to list matches' });
  }
});

/**
 * GET /api/matches/:id — Get a single match state (public)
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id as string;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(match.state);
  } catch (error) {
    console.error('Error getting match:', error);
    res.status(500).json({ error: 'Failed to get match' });
  }
});

/**
 * POST /api/matches — Create a new match (auth required)
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { state } = req.body;
    if (!state || !state.id) {
      res.status(400).json({ error: 'Match state with id is required' });
      return;
    }

    const teamAName = extractTeamName(state.teamA);
    const teamBName = extractTeamName(state.teamB);

    const match = await prisma.match.create({
      data: {
        id: state.id,
        state: state,
        status: state.status || 'setup',
        teamAName,
        teamBName,
        createdBy: req.userId,
      },
    });

    await ensureTeamsExist([teamAName, teamBName]);

    broadcastMatchCreated(state);
    broadcastMatchListUpdate();
    res.status(201).json(match.state);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

/**
 * PUT /api/matches/:id — Update full match state (auth required, must be admin)
 */
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const matchId = req.params.id as string;
    const { state } = req.body;
    if (!state) {
      res.status(400).json({ error: 'Match state is required' });
      return;
    }

    // Verify user is a match admin or match creator
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const existingState = existing.state as Record<string, unknown>;
    const previousStatus = (existing.status || existingState.status || 'idle') as string;
    const nextStatus = (state.status || 'idle') as string;
    const previousTeamAName = (existing.teamAName || existingState.teamAName || extractTeamName(existingState.teamA) || '') as string;
    const previousTeamBName = (existing.teamBName || existingState.teamBName || extractTeamName(existingState.teamB) || '') as string;
    const nextTeamAName = extractTeamName(state.teamA);
    const nextTeamBName = extractTeamName(state.teamB);

    const admins = (existingState.admins || []) as string[];
    const isAdmin = admins.includes(req.userId!);
    const isCreator = existing.createdBy === req.userId;
    // Also check if the incoming state includes this user as admin (first update after create)
    const incomingAdmins = (state.admins || []) as string[];
    const isIncomingAdmin = incomingAdmins.includes(req.userId!);
    if (!isAdmin && !isCreator && !isIncomingAdmin) {
      res.status(403).json({ error: 'Not authorized to update this match' });
      return;
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        state: state,
        status: state.status || 'idle',
        teamAName: nextTeamAName,
        teamBName: nextTeamBName,
      },
    });

    await ensureTeamsExist([nextTeamAName, nextTeamBName]);

    broadcastMatchUpdate(matchId, state);
    // Refresh LiveMatches list only when list metadata actually changes.
    // This keeps status changes (like live -> ended) accurate without per-ball load.
    const statusChanged = previousStatus !== nextStatus;
    const teamNamesChanged = previousTeamAName !== nextTeamAName || previousTeamBName !== nextTeamBName;
    if (statusChanged || teamNamesChanged) {
      broadcastMatchListUpdate();
    }
    res.json(match.state);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

/**
 * DELETE /api/matches/:id — Delete a match (auth required, must be admin or creator)
 */
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const matchId = req.params.id as string;
    const existing = await prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const existingState = existing.state as Record<string, unknown>;
    const admins = (existingState.admins || []) as string[];
    const isAdmin = admins.includes(req.userId!);
    const isCreator = existing.createdBy === req.userId;
    if (!isAdmin && !isCreator) {
      res.status(403).json({ error: 'Not authorized to delete this match' });
      return;
    }

    await prisma.match.delete({ where: { id: matchId } });
    broadcastMatchListUpdate();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

/**
 * DELETE /api/matches/reset/all — Delete ALL matches (service-key auth)
 * Uses service role key in x-service-key header for authorization
 */
router.delete('/reset/all', async (req: Request, res: Response) => {
  const serviceKey = req.headers['x-service-key'] as string;
  if (!serviceKey || serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(401).json({ error: 'Unauthorized — invalid service key' });
    return;
  }
  try {
    const count = await prisma.match.count();
    await prisma.match.deleteMany({});
    broadcastMatchListUpdate();
    res.json({ success: true, deleted: count });
  } catch (error) {
    console.error('Error resetting all matches:', error);
    res.status(500).json({ error: 'Failed to reset matches' });
  }
});

/**
 * DELETE /api/matches/cleanup/orphaned — Delete matches with no admins and no creator (auth required)
 */
router.delete('/cleanup/orphaned', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const allMatches = await prisma.match.findMany();
    const orphaned = allMatches.filter(m => {
      const state = m.state as Record<string, unknown>;
      const admins = (state.admins || []) as string[];
      return admins.length === 0 && !m.createdBy;
    });

    for (const m of orphaned) {
      await prisma.match.delete({ where: { id: m.id } });
    }

    broadcastMatchListUpdate();
    res.json({ deleted: orphaned.length, ids: orphaned.map(m => m.id) });
  } catch (error) {
    console.error('Error cleaning up matches:', error);
    res.status(500).json({ error: 'Failed to clean up matches' });
  }
});

export default router;
