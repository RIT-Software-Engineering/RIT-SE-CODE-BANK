const express = require('express');
const router = express.Router();
const prisma = new (require("@prisma/client")).PrismaClient();

/**
 * Get all rubrics
 */
router.get('/', (req, res) => {
  const rubrics = prisma.rubrics.findMany()

  if (!rubrics) {
    res.status(404).send('Rubrics not found');
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
    res.status(404).send('Rubric not found');
  }
  
  res.json(rubric);
});

module.exports = router;