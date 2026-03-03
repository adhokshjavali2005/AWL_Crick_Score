import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { broadcastMatchUpdate, broadcastMatchCreated, broadcastMatchListUpdate } from '../socket.js';

const router = Router();
const prisma = new PrismaClient();

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

    const match = await prisma.match.create({
      data: {
        id: state.id,
        state: state,
        status: state.status || 'setup',
        teamAName: state.teamA?.name || '',
        teamBName: state.teamB?.name || '',
        createdBy: req.userId,
      },
    });

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
        teamAName: state.teamA?.name || '',
        teamBName: state.teamB?.name || '',
      },
    });

    broadcastMatchUpdate(matchId, state);
    broadcastMatchListUpdate();
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
