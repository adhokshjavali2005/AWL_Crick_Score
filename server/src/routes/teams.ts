import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
let teamsTableReadyPromise: Promise<void> | null = null;

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

async function upsertTeamsMirror(teamName: string, players: unknown[], playerNames: string[]) {
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "Teams" ("id", "teamName", "players", "playerNames", "updatedAt")
    VALUES (${id}, ${teamName}, ${JSON.stringify(players)}::jsonb, ${JSON.stringify(playerNames)}::jsonb, NOW())
    ON CONFLICT ("teamName")
    DO UPDATE SET
      "players" = EXCLUDED."players",
      "playerNames" = EXCLUDED."playerNames",
      "updatedAt" = NOW()
  `;
}

function toPlayerObjects(teamName: string, players: unknown, playerNames: unknown): Array<{ id: string; name: string }> {
  if (Array.isArray(players) && players.length > 0) {
    const normalized = players
      .map((player, index) => {
        if (!player || typeof player !== 'object') return null;
        const p = player as { id?: unknown; name?: unknown };
        if (typeof p.name !== 'string' || !p.name.trim()) return null;
        const safeName = p.name.trim();
        const safeId = typeof p.id === 'string' && p.id.trim()
          ? p.id
          : `${teamName}-${index}-${safeName}`;
        return { id: safeId, name: safeName };
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));

    if (normalized.length > 0) return normalized;
  }

  if (Array.isArray(playerNames)) {
    return playerNames
      .map((name, index) => {
        if (typeof name !== 'string' || !name.trim()) return null;
        const safeName = name.trim();
        return { id: `${teamName}-${index}-${safeName}`, name: safeName };
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));
  }

  return [];
}

/**
 * GET /api/teams — List all team names
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    await ensureTeamsTableShape();
    const storedTeams = await prisma.$queryRaw<Array<{ teamName: string }>>`
      SELECT "teamName"
      FROM "Teams"
      ORDER BY "teamName" ASC
    `;
    const names = storedTeams.map(t => t.teamName);
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
    await ensureTeamsTableShape();
    const teamName = req.params.name as string;
    const mirroredTeamRows = await prisma.$queryRaw<Array<{ players: unknown; playerNames: unknown }>>`
      SELECT "players", "playerNames"
      FROM "Teams"
      WHERE "teamName" = ${teamName}
      LIMIT 1
    `;
    const row = mirroredTeamRows[0];
    const reflectedPlayers = toPlayerObjects(teamName, row?.players, row?.playerNames);
    res.json(reflectedPlayers);
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
    await ensureTeamsTableShape();
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

    await upsertTeamsMirror(teamName, players, playerNames);

    res.json(team.players);
  } catch (error) {
    console.error('Error saving team players:', error);
    res.status(500).json({ error: 'Failed to save team players' });
  }
});

export default router;
