const express = require('express');
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Set up the default templates
 */
router.get('/init', async (req, res) => {
    try {
        await prisma.$transaction(async () => {
            await prisma.templates.create({
                data: {
                    index: 0,
                    rubric: {
                        create: {
                            title: "Holistic",
                            description: "The most general kind of rubric. Lists levels of performance along with a broad description of the characteristics that define what it means to achieve each level. These are typically labelled using letters, numbers, or words.",
                            rows: 6,
                            columns: 2,
                            criteria_column: 1,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                index: 0,
                                                name: "Grade"
                                            },
                                            {
                                                index: 1,
                                                name: "Description"
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        index: 0,
                                        name: "A",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Excellent"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 1,
                                        name: "B",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Proficient"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 2,
                                        name: "C",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Good"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 3,
                                        name: "D",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Needs Improvement"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 4,
                                        name: "F",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "You screwed up"
                                                }
                                            ]
                                        }
                                    },
                                ]
                            }
                        }
                    }
                }
            });
            await prisma.templates.create({
                data: {
                    index: 1,
                    rubric: {
                        create: {
                            title: "Analytic",
                            description: "An analytic rubric breaks down the characteristics of an assignment into different dimensions of the rubric. Each of these dimensions has different levels that define the standard of performance expected to be achieved at each level. This allows the scorer to itemize and define exactly what aspects are strong and which ones need improvement.",
                            rows: 4,
                            columns: 5,
                            criteria_column: 1,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                index: 0,
                                                name: "Criteria"
                                            },
                                            {
                                                index: 1,
                                                points: 10
                                            },
                                            {
                                                index: 2,
                                                points: 7
                                            },
                                            {
                                                index: 3,
                                                points: 3
                                            },
                                            {
                                                index: 4,
                                                points: 0
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        index: 0,
                                        name: "Project",
                                        description: "",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Project work excelled in A, B, and C."
                                                },
                                                {
                                                    index: 1,
                                                    description: "level 2."
                                                },
                                                {
                                                    index: 2,
                                                    description: "level 3."
                                                },
                                                {
                                                    index: 3,
                                                    description: "level 4."
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 1,
                                        name: "Homework",
                                        description: "",
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Project work excelled in A, B, and C."
                                                },
                                                {
                                                    index: 1,
                                                    description: "level 2."
                                                },
                                                {
                                                    index: 2,
                                                    description: "level 3."
                                                },
                                                {
                                                    index: 3,
                                                    description: "level 4."
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 2,
                                        name: "Participation",
                                        points: 5,
                                        levels: {
                                            create: [
                                                {
                                                    index: 0,
                                                    description: "Student participated at least once during class discussion.",
                                                    points: 5
                                                },
                                                {
                                                    index: 1,
                                                    description: "Student did not participate in class discussion.",
                                                    points: 0
                                                },
                                            ]
                                        }
                                    },
                                ]
                            }
                        }
                    }
                }
            });
            await prisma.templates.create({
                data: {
                    index: 2,
                    rubric: {
                        create: {
                            title: "Single-Point",
                            description: "A single-point rubric also breaks down the components of an assignment into different criteria. The rubric only defines the criteria for proficiency and leaves space for the scorer to note where the submitter fell short or exceeded in their work, without defining how to do so. ",
                            rows: 4,
                            columns: 3,
                            criteria_column: 2,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                index: 0,
                                                name: "Areas that fell short"
                                            },
                                            {
                                                index: 1,
                                                name: "Criteria"
                                            },
                                            {
                                                index: 2,
                                                name: "Areas of excellence"
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        index: 0,
                                        name: "Project",
                                        description: "Project work meets requirements A, B, and C.",
                                        points: 10,
                                        levels: {
                                            create: [
                                                {
                                                    index: 0
                                                },
                                                {
                                                    index: 1
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 1,
                                        name: "Homework",
                                        description: "Homework is complete, and submitted on time.",
                                        points: 10,
                                        levels: {
                                            create: [
                                                {
                                                    index: 0
                                                },
                                                {
                                                    index: 1
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        index: 2,
                                        name: "Participation",
                                        description: "Student participated at least once during class discussion.",
                                        points: 5,
                                        levels: {
                                            create: [
                                                {
                                                    index: 0
                                                },
                                                {
                                                    index: 1
                                                }
                                            ]
                                        }
                                    },
                                ]
                            }
                        }
                    }
                }
            });
        });
        res.status(200).send('Default templates initialized successfully.');
    } catch (error) {
        console.error(error)
        res.status(500).send('There was an error initializing default templates.');
    }
})


/**
 * Get all templates
 */
router.get('/', async (req, res) => {
    try {
        const templates = await prisma.templates.findMany({
            orderBy: {
                index: 'asc'
            },
            include: {
                rubric: {
                    select: {
                        title: true,
                        description: true
                    }
                }
            }
        });

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
            where: { id: id },
            include: {
                rubric: {
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
                }
            }
        })

        res.send(template);
    } catch (error) {
        console.error(error);
        res.status(500).send('There was an error fetching templates.');
    }
});

module.exports = router;