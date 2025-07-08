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

    if (!rubric) {
      return res.status(404).json({ error: "Rubric not found" });
    }

    res.send(rubric);
  } catch (error) {
    res.status(500).send('There was an error fetching rubrics.');
  }
});

/**
 * Create a rubric with the data in body
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body

    await prisma.rubrics.create({
      data: {
        title: data.title,
        description: data.description,
        rows: data.rows,
        columns: data.columns,
        criteria_column: data.criteria_column,
        headers: {
          create: {
            titles: {
              create: data.headers.titles.map((header) => {
                return {
                  name: header.name,
                  description: header.description,
                  points: header.points,
                  weight: header.weight,
                  index: header.index
                }
              })
            }
          }
        },
        criteria: {
          create: data.criteria.map((criterion) => {
            return {
              name: criterion.name,
              description: criterion.description,
              points: criterion.points,
              weight: criterion.weight,
              index: criterion.index,
              levels: {
                create: criterion.levels.map((level) => {
                  return {
                    name: level.name,
                    description: level.description,
                    points: level.points,
                    weight: level.weight,
                    index: level.index
                  }
                })
              }
            }
          })
        }
      }
    });

    res.status(200).send("Rubric created.");
  } catch (error) {
    res.status(500).send('There was an error fetching rubrics.');
  }
})

/**
 * Update a rubric by id with the data in body.
 */
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body

    await prisma.$transaction([
      await prisma.headers.delete({
        where: { rubric_id: id }
      }),
      await prisma.criteria.deleteMany({
        where: { rubric_id: id }
      }),
      await prisma.rubrics.update({
        where: { id: id },
        data: {
          title: data.title,
          description: data.description,
          rows: data.rows,
          columns: data.columns,
          criteria_column: data.criteria_column,
          headers: {
            create: {
              titles: {
                create: data.headers.titles.map((header) => {
                  return {
                    name: header.name,
                    description: header.description,
                    points: header.points,
                    weight: header.weight,
                    index: header.index
                  }
                })
              }
            }
          },
          criteria: {
            create: data.criteria.map((criterion) => {
              return {
                name: criterion.name,
                description: criterion.description,
                points: criterion.points,
                weight: criterion.weight,
                index: criterion.index,
                levels: {
                  create: criterion.levels.map((level) => {
                    return {
                      name: level.name,
                      description: level.description,
                      points: level.points,
                      weight: level.weight,
                      index: level.index
                    }
                  })
                }
              }
            })
          }
        }
      })
    ]);

    res.status(200).send("Rubric updated.");
  } catch (error) {
    res.status(500).send('There was an error fetching rubrics.');
  }
})

/**
 * Delete a rubric by id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.rubrics.delete({
      where: { id: id }
    })

    res.status(200).send("Rubric deleted");
  } catch (error) {
    res.status(500).send('There was an error deleting rubric.');
  }
});

module.exports = router;