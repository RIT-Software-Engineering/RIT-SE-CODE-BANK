import express, { Request, Response } from 'express';
import { prisma } from '../database';

const router = express.Router();

// Create a new team in a community
router.post('/team', async (req: Request, res: Response) => {
  const { name, communityId, maxSize } = req.body;
  if (!name || typeof name !== 'string' || !communityId || typeof maxSize !== 'number') {
    res.status(400).json({ error: 'Team name, communityId, and maxSize are required.' });
    return;
  }
  try {
    const team = await prisma.team.create({
      data: {
        name,
        communityId: Number(communityId),
        maxSize: maxSize,
      },
    });
    res.status(201).json({ message: 'Team created.', team });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Team already exists in this community.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// Update a team's name
router.put('/team/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Team name is required.' });
    return;
  }
  try {
    const team = await prisma.team.update({
      where: { id: Number(id) },
      data: { name },
    });
    res.json({ message: 'Team updated.', team });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete a team
router.delete('/team/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.team.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Team deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to add a user to a team
router.post('/team/:teamId/add-user', async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'User ID is required.' });
    return;
  }
  try {
    const team = await prisma.team.update({
      where: { id: Number(teamId) },
      data: {
        users: {
          connect: { id: Number(userId) }
        }
      },
      include: { users: true }
    });
    res.json({ message: 'User added to team.', team });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to get all users in a team
router.get('/team/:teamId/users', async (req: Request, res: Response) => {
  const { teamId } = req.params;
  if (!teamId) {
    res.status(400).json({ error: 'Team ID is required.' });
    return;
  }
  try {
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: { users: true }
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }
    res.json({ users: team.users });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
