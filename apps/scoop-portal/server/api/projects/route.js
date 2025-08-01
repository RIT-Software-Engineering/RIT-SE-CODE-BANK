import { Router } from "express";
const router = Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

// POST a new project
router.post("/", async (req, res) => {
  const { title, display_name, description } = req.body;

  if (!title || !display_name || !description) {
    return res.status(400).json({ message: "Missing required fields: title, display_name, or description" });
  }

  try {
    const project = await prisma.project.create({
      data: {
        title,
        display_name,
        description,
      },
    });

    res.status(201).json({ message: "Project created", project });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Failed to create project", error: error.message });
  }
});

export default router;
