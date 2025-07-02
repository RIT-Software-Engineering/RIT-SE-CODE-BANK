const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get all rubrics
 */
router.get('/', async (req, res) => {
  try {
    const rubrics = await prisma.rubrics.findMany();

    res.send(rubrics);
  } catch (error) {
    res.status(500).send('There was an error fetching rubrics.');
  }
});

/**
 * Get a rubric by id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const rubric = await prisma.rubrics.findUnique({
      where: { id: id },
      include: {
        headers: {
          include: {
            titles: {
              orderBy: {
                index: 'asc'
              }
            }
          }
        },
        criteria: {
          orderBy: {
            index: 'asc'
          },
          include: {
            levels: {
              orderBy: {
                index: 'asc'
              }
            }
          }
        }
      }
    })

    res.send(rubric);
  } catch (error) {
    res.status(500).send('There was an error fetching rubrics.');
  }
});

module.exports = router;