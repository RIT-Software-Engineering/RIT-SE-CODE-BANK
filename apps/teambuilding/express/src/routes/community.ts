import express, { Request, Response } from 'express';
import { prisma } from '../database';

const router = express.Router();

// Create a new community
router.post('/community', async (req: Request, res: Response) => {
  const { name, managerId } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Community name is required.' });
    return;
  }
  if (!managerId) {
    res.status(400).json({ error: 'Manager ID is required.' });
    return;
  }
  try {
    const community = await prisma.community.create({
      data: { 
        name,
        manager: { connect: { id: Number(managerId) } }
      },
    });
    res.status(201).json({ message: 'Community created.', community });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Community already exists.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// Delete a community
router.delete('/community/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.community.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Community deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to get all communities under a manager by managerId
router.get('/communities', async (req: Request, res: Response) => {
  const { managerId } = req.query;
  if (!managerId) {
    res.status(400).json({ error: 'Manager ID is required.' });
    return;
  }
  try {
    const communities = await prisma.community.findMany({
      where: { managerId: Number(managerId) },
      include: { 
        teams: { include: { users: true } }, 
        users: true 
      },
    });
    res.json({ communities });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to add a user to a community
router.post('/community/:communityId/add-user', async (req: Request, res: Response) => {
  const { communityId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'User ID is required.' });
    return;
  }
  try {
    const community = await prisma.community.update({
      where: { id: Number(communityId) },
      data: {
        users: {
          connect: { id: Number(userId) }
        }
      },
      include: { users: true }
    });
    res.json({ message: 'User added to community.', community });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to get all users in a community
router.get('/community/:communityId/users', async (req: Request, res: Response) => {
  const { communityId } = req.params;
  if (!communityId) {
    res.status(400).json({ error: 'Community ID is required.' });
    return;
  }
  try {
    const community = await prisma.community.findUnique({
      where: { id: Number(communityId) },
      include: { users: true }
    });
    if (!community) {
      res.status(404).json({ error: 'Community not found.' });
      return;
    }
    res.json({ users: community.users });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
