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
// Endpoint to import users from CSV and add them to a community
router.post('/community/:communityId/import-csv', async (req: Request, res: Response) => {
  const { communityId } = req.params;
  const { usernames } = req.body; // Array of usernames from CSV

  if (!communityId) {
    res.status(400).json({ error: 'Community ID is required.' });
    return;
  }
  
  if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
    res.status(400).json({ error: 'Usernames array is required.' });
    return;
  }

  try {
    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: Number(communityId) },
      include: { users: true }
    });

    if (!community) {
      res.status(404).json({ error: 'Community not found.' });
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

        // Check if user is already in the community
        const isAlreadyInCommunity = community.users.some(communityUser => communityUser.id === user.id);

        if (isAlreadyInCommunity) {
          results.alreadyInTeam.push(trimmedUsername);
        } else {
          // Add user to community
          await prisma.community.update({
            where: { id: Number(communityId) },
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

// Endpoint to create a community with teams and users from JSON structure
router.post('/community/bulk-create', async (req: Request, res: Response) => {
  const { managerId, data } = req.body;
  
  if (!managerId) {
    res.status(400).json({ error: 'Manager ID is required.' });
    return;
  }
  
  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Data object is required.' });
    return;
  }

  try {
    

    // Extract community name (should be the only key at root level)
    const communityNames = Object.keys(data);
    if (communityNames.length !== 1) {
      res.status(400).json({ error: 'Data should contain exactly one community.' });
      return;
    }

    const communityName = communityNames[0];
    const teamsData = data[communityName];

    if (!teamsData || typeof teamsData !== 'object') {
      res.status(400).json({ error: 'Community should contain teams data.' });
      return;
    }

    // Create the community
    const community = await prisma.community.create({
      data: {
        name: communityName,
        manager: { connect: { id: Number(managerId) } }
      }
    });

    

    // Process each team
    for (const [teamName, teamMembers] of Object.entries(teamsData)) {
      try {
        if (!Array.isArray(teamMembers)) {
          continue
        }

        // Create the team with maxSize equal to the number of members
        const team = await prisma.team.create({
          data: {
            name: teamName,
            communityId: community.id,
            maxSize: teamMembers.length
          }
        });

        

        // Process each user in the team
        for (const username of teamMembers) {
          try {
            const trimmedUsername = String(username).trim();
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
             
            }

            // Add user to the community
            await prisma.community.update({
              where: { id: community.id },
              data: {
                users: {
                  connect: { id: user.id }
                }
              }
            });

            // Add user to the team
            await prisma.team.update({
              where: { id: team.id },
              data: {
                users: {
                  connect: { id: user.id }
                }
              }
            });

          

          } catch (userError: any) {
            res.status(500).json({ error: `Error processing user "${username}": ${userError.message}` });
          }
        }

      } catch (teamError: any) {
        res.status(500).json({ error: `Error processing team "${teamName}": ${teamError.message}` });
      }
    }

    res.status(201).json({
      message: 'Bulk community creation completed.',
      
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Server error during bulk creation.' });
  }
});

export default router;
