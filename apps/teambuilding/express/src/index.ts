import express, { Request, Response } from "express";
// If you generated Prisma Client to a custom output, use the correct path:
import { PrismaClient } from '../app/generated/prisma';
// If you use the default, use: import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import cors from "cors";



const prisma = new PrismaClient().$extends(withAccelerate());

const app = express();
app.use(cors()); // Allow all origins by default
app.use(express.json());



// Endpoint to get a user's role by username (case-insensitive)
app.get('/api/user-role', async (req: Request, res: Response) => {
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
app.post('/api/create-user', async (req: Request, res: Response) => {
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

// Create a new community
app.post('/api/community', async (req: Request, res: Response) => {
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
app.delete('/api/community/:id', async (req: Request, res: Response) => {
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

// Create a new team in a community
app.post('/api/team', async (req: Request, res: Response) => {
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
app.put('/api/team/:id', async (req: Request, res: Response) => {
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
app.delete('/api/team/:id', async (req: Request, res: Response) => {
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

// Endpoint to get all info for a specific user by username
app.get('/api/user', async (req: Request, res: Response) => {
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

// Endpoint to get all communities under a manager by managerId
app.get('/api/communities', async (req: Request, res: Response) => {
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

// Endpoint to get all users with the USER role
app.get('/api/users/user-role', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to add a user to a community
app.post('/api/community/:communityId/add-user', async (req: Request, res: Response) => {
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

// Endpoint to add a user to a team
app.post('/api/team/:teamId/add-user', async (req: Request, res: Response) => {
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

// Endpoint to get all users in a community
app.get('/api/community/:communityId/users', async (req: Request, res: Response) => {
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

// Endpoint to get all users in a team
app.get('/api/team/:teamId/users', async (req: Request, res: Response) => {
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

// Endpoint to get all teams a user is on
app.get('/api/user/:userId/teams', async (req: Request, res: Response) => {
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

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: https://github.com/prisma/prisma-examples/blob/latest/orm/express/README.md#using-the-rest-api`),
);
