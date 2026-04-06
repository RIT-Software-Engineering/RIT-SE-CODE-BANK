import express from "express";

export default function makeCourseWebsiteRouter(prisma) {
  const router = express.Router();

  // list all the courses
  router.get("/", async (_req, res) => {
    try {
      const courses = await prisma.Course.findMany({
        orderBy: [{ id: "asc" }],
        select: { id: true, professorId: true },
      });
      res.json(courses);
    } catch (e) {
      res
        .status(500)
        .json({
          error: "Failed to list courses",
          detail: String(e.message || e),
        });
    }
  });

  // Get details for a single course
  // IMPORTANT: This must come AFTER more specific routes like /:courseId/events
  router.get("/:courseId", async (req, res) => {
    const { courseId: courseIdString } = req.params;
    const courseId = parseInt(courseIdString);
    try {
      const course = await prisma.Course.findUnique({
        where: { id: courseId },
        include: {
          professors: { select: { fname: true, lname: true, email: true } },
        },
      });

      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json(course);
    } catch (e) {
      res
        .status(500)
        .json({
          error: "Failed to fetch course",
          detail: String(e.message || e),
        });
    }
  });

  return router;
};