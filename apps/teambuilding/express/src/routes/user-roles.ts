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
  const { username, role, firstName, lastName, email } = req.body;

  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  if (!role || !["ADMIN", "MANAGER", "USER"].includes(role)) {
    res.status(400).json({ error: 'Role must be ADMIN, MANAGER, or USER.' });
    return;
  }

  try {
    const userData: any = {
      username,
      role,
    };

    if (firstName && typeof firstName === 'string') {
      userData.firstName = firstName.trim();
    }
    if (lastName && typeof lastName === 'string') {
      userData.lastName = lastName.trim();
    }
    if (email && typeof email === 'string') {
      userData.email = email.trim().toLowerCase();
    }
    res.status(201).json({ message: 'User created.', userData });
  } catch (error: any) {
    if (error.code === 'P2002') { // Unique constraint failed
      if (error.meta?.target?.includes('username')) {
        res.status(409).json({ error: 'Username already exists.' });
      } else if (error.meta?.target?.includes('email')) {
        res.status(409).json({ error: 'Email already exists.' });
      } else {
        res.status(409).json({ error: 'Unique constraint violation.' });
      }
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

// Endpoint to get user details (firstName, lastName, email) by username
router.get('/user/:username/details', async (req: Request, res: Response) => {
  const { username } = req.params;
  
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { username: true, firstName: true, lastName: true, email: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error in /user/:username/details:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Endpoint to update user details (firstName, lastName, email) by username
router.put('/user/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  const { firstName, lastName, email } = req.query;
  
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  try {
    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    
    if (firstName !== undefined) {
      updateData.firstName = firstName
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName
    }
    if (email !== undefined) {
      updateData.email = email
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: updateData
    });

    res.json({ 
      message: 'User updated successfully.', 
      user: updatedUser 
    });
  } catch (error: any) {
    
      res.status(500).json({ error: 'Server error.' });
    
  }
});

export default router;
