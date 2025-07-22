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

// Endpoint to remove a user from a team
router.post('/team/:teamId/remove-user', async (req: Request, res: Response) => {
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
          disconnect: { id: Number(userId) }
        }
      },
      include: { users: true }
    });
    res.json({ message: 'User removed from team.', team });
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

// Endpoint to import users from CSV and add them to a team
router.post('/team/:teamId/import-csv', async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { usernames } = req.body; // Array of usernames from CSV

  if (!teamId) {
    res.status(400).json({ error: 'Team ID is required.' });
    return;
  }
  
  if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
    res.status(400).json({ error: 'Usernames array is required.' });
    return;
  }

  try {
    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: { users: true }
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    const results: {
      created: string[];
      added: string[];
      errors: string[];
      alreadyInTeam: string[];
    } = {
      created: [],
      added: [],
      errors: [],
      alreadyInTeam: []
    };

    for (const username of usernames) {
      try {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) continue;

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { username: trimmedUsername }
        });

        // Create user if they don't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              username: trimmedUsername,
              role: 'USER'
            }
          });
          results.created.push(trimmedUsername);
        }

        // Check if user is already in the team
        const isAlreadyInTeam = team.users.some(teamUser => teamUser.id === user.id);
        
        if (isAlreadyInTeam) {
          results.alreadyInTeam.push(trimmedUsername);
        } else {
          // Add user to team
          await prisma.team.update({
            where: { id: Number(teamId) },
            data: {
              users: {
                connect: { id: user.id }
              }
            }
          });
          results.added.push(trimmedUsername);
        }

      } catch (userError: any) {
        results.errors.push(`Error processing "${username}": ${userError.message}`);
      }
    }

    res.json({
      message: 'CSV import completed.',
      results: {
        usersCreated: results.created.length,
        usersAdded: results.added.length,
        usersAlreadyInTeam: results.alreadyInTeam.length,
        errors: results.errors.length,
        details: results
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Server error during CSV import.' });
  }
});

export default router;
