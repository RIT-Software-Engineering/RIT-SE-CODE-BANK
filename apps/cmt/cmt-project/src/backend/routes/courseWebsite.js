const express = require("express");

module.exports = function makeCourseWebsiteRouter(prisma) {
  const router = express.Router();

  // list all the courses
  router.get('/', async (_req, res) => {
    try {
      const courses = await prisma.Course.findMany({
        orderBy: [{ id: 'asc' }],
        select: { id: true, professorId: true },
      });
      res.json(courses);
    } catch (e) {
      res.status(500).json({ error: 'Failed to list courses', detail: String(e.message || e) });
    }
  });

  // Get details for a single course
  router.get("/:courseId", async (req, res) => {
    const { courseId } = req.params;
    try {
      const course = await prisma.course.findUnique({
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
        .json({ error: "Failed to fetch course", detail: String(e.message || e) });
    }
  });

  // Fetch all events (assignments, lectures, exams, etc) for a course
  router.get("/:courseId/events", async (req, res) => {
    const { courseId } = req.params;
    try {
      const events = await prisma.event.findMany({
        where: { courseId },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        include: { course: true },
      });
      res.json({ success: true, data: events });
    } catch (e) {
      res
        .status(500)
        .json({ error: "Failed to fetch events", detail: String(e.message || e) });
    }
  });
  return router;
};