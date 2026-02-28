import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/profile — Upsert user profile (synced from Supabase Auth)
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const profile = await prisma.profile.upsert({
      where: { id: req.userId! },
      create: {
        id: req.userId!,
        name,
        email,
      },
      update: {
        name,
        email,
      },
    });

    res.json(profile);
  } catch (error) {
    console.error('Error upserting profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

/**
 * GET /api/profile — Get current user's profile
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.userId! },
    });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * GET /api/profile/search?email=... — Search for a user by email (for adding admins)
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: 'Email query parameter is required' });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Error searching profile:', error);
    res.status(500).json({ error: 'Failed to search profiles' });
  }
});

export default router;
