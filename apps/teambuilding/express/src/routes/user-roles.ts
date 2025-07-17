import express, { Request, Response } from 'express';
import { prisma } from '../database';

const router = express.Router();

// Endpoint to get a user's role by username (case-insensitive)
router.get('/user-role', async (req: Request, res: Response) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to create a new user given a username and role
router.post('/create-user', async (req: Request, res: Response) => {
  const { username, role } = req.body;

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  if (!role || !["ADMIN", "MANAGER", "USER"].includes(role)) {
    res.status(400).json({ error: 'Role must be ADMIN, MANAGER, or USER.' });
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        role,
      },
    });
    res.status(201).json({ message: 'User created.', user });
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint failed
      res.status(409).json({ error: 'Username already exists.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// Endpoint to get all info for a specific user by username
router.get('/user', async (req: Request, res: Response) => {
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      // Remove 'select' to get all fields, or add 'include' for relations if needed
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to get all users with the USER role
router.get('/users/user-role', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to get all teams a user is on
router.get('/user/:userId/teams', async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'User ID is required.' });
    return;
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        teams: {
          include: {
            community: true,
            users: true
          }
        }
      }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ teams: user.teams });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
