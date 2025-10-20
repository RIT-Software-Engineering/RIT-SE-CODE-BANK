const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST: Create a new course template
router.post("/", async (req, res) => {
  try {
    const {
      name,
      semester,
      weeks,
      assignments,
      exams,
      labs,
      projects,
      professorId,
    } = req.body;

    const newTemplate = await prisma.courseTemplate.create({
      data: {
        name,
        semester,
        weeks: parseInt(weeks),
        assignments: parseInt(assignments),
        exams: parseInt(exams),
        labs: parseInt(labs),
        projects: parseInt(projects),
        professorId: parseInt(professorId),
      },
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// GET: Get all templates for a professor
router.get("/professor/:professorId", async (req, res) => {
  try {
    const { professorId } = req.params;

    const templates = await prisma.courseTemplate.findMany({
      where: {
        professorId: parseInt(professorId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

module.exports = router;
