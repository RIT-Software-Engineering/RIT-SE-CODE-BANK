const express = require('express');
const router = express.Router();
const prisma = new (require("@prisma/client")).PrismaClient();

/**
 * Get all rubrics
 */
router.get('/', (req, res) => {
  const rubrics = prisma.rubrics.findMany()

  if (!rubrics) {
    res.status(500).send('There was an error fetching rubrics.');
  }

  res.send(rubrics);
})

/**
 * Get a rubric by id
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;

  const rubric = prisma.rubrics.findUnique({
    where: { id: id }
  })

  if (!rubric) {
    res.status(500).send('There was an error fetching the rubric');
  }
  
  res.json(rubric);
});

module.exports = router;