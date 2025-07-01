const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get all templates
 */
router.get('/', async (req, res) => {
  try {
    const templates = await prisma.templates.findMany();

    res.send(templates);
  } catch (error) {
    res.status(500).send('There was an error fetching templates.');
  }
});

/**
 * Get a template by id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const template = await prisma.templates.findUnique({
    where: { id: id }
  })

    res.send(template);
  } catch (error) {
    res.status(500).send('There was an error fetching templates.');
  }
});

module.exports = router;