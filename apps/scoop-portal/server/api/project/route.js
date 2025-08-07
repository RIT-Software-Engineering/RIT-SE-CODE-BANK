import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET all projects
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects: ", error);
    res.status(500).json({
      message: "Error fetching projects",
      error: error.message,
    });
  }
});

/**
 * GET a specific project
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });
    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project: ", error);
    res.status(500).json({
      message: "Failed to fetch project",
      error: error.message,
    });
  }
});

/**
 * POST a new project
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
router.post("/", async (req, res) => {
  const {
    submission_date,
    status,
    title,
    display_name,
    description,
    project_challenges,
    constraints_assumptions,
    project_search_keywords,
    team_name,
    poster,
    video,
    website,
    synopsis,
    semesterId,
    created_at,
    updated_at,
  } = req.body;
  try {
    const newProject = await prisma.project.create({
      data: {
        submission_date,
        status,
        title,
        display_name,
        description,
        project_challenges,
        constraints_assumptions,
        project_search_keywords,
        team_name,
        poster,
        video,
        website,
        synopsis,
        semesterId,
        created_at,
        updated_at,
      },
    });
    res.status(200).json({
      message: "Project created",
      project: newProject,
    });
  } catch (error) {
    console.error();
    res.status(500).json({
      message: "Error creating project",
      error: error.message,
    });
  }
});

/**
 * PUT (update) an existing project
 *
 * @param {Object} req - The request object containing the project id and the data to be updated
 * @param {Object} res - The response object
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    submission_date,
    status,
    title,
    display_name,
    description,
    project_challenges,
    constraints_assumptions,
    project_search_keywords,
    team_name,
    poster,
    video,
    website,
    synopsis,
    semesterId,
    updated_at,
  } = req.body;
  try {
    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        submission_date,
        status,
        title,
        display_name,
        description,
        project_challenges,
        constraints_assumptions,
        project_search_keywords,
        team_name,
        poster,
        video,
        website,
        synopsis,
        semesterId,
        updated_at,
      },
    });
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project: ", error);
    res.status(500).json({
      message: "Failed to update project",
      error: error.message,
    });
  }
});

export default router;
