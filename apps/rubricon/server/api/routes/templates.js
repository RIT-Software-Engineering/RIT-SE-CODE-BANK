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
                    rubric: {
                        create: {
                            title: "Holistic",
                            description: "Holistic rubrics are general...",
                            rows: 6,
                            columns: 2,
                            criteria_column: 1,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                name: "Grade"
                                            },
                                            {
                                                name: "Description"
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        name: "A",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Excellent"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "B",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Proficient"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "C",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Good"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "D",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Needs Improvement"
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "F",
                                        levels: {
                                            create: [
                                                {
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
                    rubric: {
                        create: {
                            title: "Analytic",
                            description: "Analytic rubrics are complex...",
                            rows: 4,
                            columns: 5,
                            criteria_column: 1,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                name: "Criteria"
                                            },
                                            {
                                                points: 10
                                            },
                                            {
                                                points: 7
                                            },
                                            {
                                                points: 3
                                            },
                                            {
                                                points: 0
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        name: "Project",
                                        description: "",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Project work excelled in A, B, and C."
                                                },
                                                {
                                                    description: "level 2."
                                                },
                                                {
                                                    description: "level 3."
                                                },
                                                {
                                                    description: "level 4."
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "Homework",
                                        description: "",
                                        levels: {
                                            create: [
                                                {
                                                    description: "Project work excelled in A, B, and C."
                                                },
                                                {
                                                    description: "level 2."
                                                },
                                                {
                                                    description: "level 3."
                                                },
                                                {
                                                    description: "level 4."
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "Participation",
                                        points: 5,
                                        levels: {
                                            create: [
                                                {
                                                    description: "Student participated at least once during class discussion.",
                                                    points: 5
                                                },
                                                {
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
                    rubric: {
                        create: {
                            title: "Single-Point",
                            description: "Single-Point rubrics are simple, but can take longer to grade. However, they make it much easier for people being evaluated to understand where they are doing well, or falling short.",
                            rows: 4,
                            columns: 3,
                            criteria_column: 1,
                            headers: {
                                create: {
                                    titles: {
                                        create: [
                                            {
                                                name: "Areas that fell short"
                                            },
                                            {
                                                name: "Criteria"
                                            },
                                            {
                                                name: "Areas of proficiency"
                                            }
                                        ]
                                    }
                                }
                            },
                            criteria: {
                                create: [
                                    {
                                        name: "Project",
                                        description: "Project work meets requirements A, B, and C.",
                                        points: 10,
                                        levels: {
                                            create: [
                                                {
                                                },
                                                {
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "Homework",
                                        description: "Homework is complete, and submitted on time.",
                                        points: 10,
                                        levels: {
                                            create: [
                                                {
                                                },
                                                {
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        name: "Participation",
                                        description: "Student participated at least once during class discussion.",
                                        points: 5,
                                        levels: {
                                            create: [
                                                {
                                                },
                                                {
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
            where: { id: id },
            include: {
                rubric: {
                    include: {
                        headers: {
                            include: {
                                titles: true
                            }
                        },
                        criteria: {
                            include: {
                                levels: true
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