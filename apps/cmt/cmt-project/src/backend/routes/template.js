import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = express.Router();
export default router

// POST: Create a new course template
router.post("/", async (req, res) => {
  try {
    const {
      name,
      year,
      season,
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
        year: parseInt(year),
        season,
        weeks: parseInt(weeks),
        assignments: parseInt(assignments),
        exams: parseInt(exams),
        labs: parseInt(labs),
        projects: parseInt(projects),
        professorId: professorId,
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
        professorId: professorId,
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

// GET: Get a single template by ID with its items
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.courseTemplate.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        templateItems: true,
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

// PUT: Update a template
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, season, year, weeks, assignments, exams, labs, projects } =
      req.body;

    const updatedTemplate = await prisma.courseTemplate.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name,
        season,
        year: parseInt(year),
        weeks: parseInt(weeks),
        assignments: parseInt(assignments),
        exams: parseInt(exams),
        labs: parseInt(labs),
        projects: parseInt(projects),
      },
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// DELETE: Delete a template
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.courseTemplate.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});
