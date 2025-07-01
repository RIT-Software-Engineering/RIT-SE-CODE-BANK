const express = require('express');
const router = express.Router();
const prisma = new (require("@prisma/client")).PrismaClient();

/**
 * Get all templates
 */
router.get('/', (req, res) => {
  const templates = prisma.templates.findMany()

  if (!templates) {
    res.status(404).send('Templates not found');
  }

  res.send(templates);
})

/**
 * Get a template by id
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;

  const template = prisma.templates.findUnique({
    where: { id: id }
  })

  if (!template) {
    res.status(404).send('Template not found');
  }
  
  res.json(template);
});

module.exports = router;