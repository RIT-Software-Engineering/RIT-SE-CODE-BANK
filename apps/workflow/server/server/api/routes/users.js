const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Routes
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.create({ data: { name, email } });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'User creation failed', details: err.message });
  }
});

router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

router.put('/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email }
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'User update failed', details: err.message });
  }
});

router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;
    try {
        await prisma.user.delete({ where: { id: userId } });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: 'User deletion failed', details: err.message });
    }
});

module.exports = router;