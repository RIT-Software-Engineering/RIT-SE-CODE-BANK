// routes/events.js
const express = require("express");

// Factory: server.js calls makeEventsRouter(prisma)
module.exports = function makeEventsRouter(prisma) {
  const router = express.Router();

  // --- helpers ---
  const scopedWhere = (userId) => ({
    OR: [
      { courseId: null }, // allow global/admin events (optional)
      { course: { members: { some: { userId } } } },
    ],
  });

  async function getMembership(userId, courseId) {
    if (!courseId) return null;
    return prisma.courseMember.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
  }

  function canEdit(role) {
    return ["OWNER", "INSTRUCTOR", "TA"].includes(role || "");
  }

  async function assertEditor(userId, courseId) {
    const m = await getMembership(userId, courseId);
    if (!m || !canEdit(m.role)) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }
  }

  // --- validation middleware (kept from your version) ---
  const validateEvent = (req, res, next) => {
    const { title, courseId, type, date } = req.body;
    if (!title || (courseId === undefined) || !type || !date) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["title", "courseId", "type", "date"],
      });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    const validTypes = ["exam", "assignment", "lecture", "lab", "office_hours", "meeting"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid event type", validTypes });
    }
    if (req.body.importance) {
      const validImportance = ["Low", "Medium", "High"];
      if (!validImportance.includes(req.body.importance)) {
        return res.status(400).json({ error: "Invalid importance level", validImportance });
      }
    }
    next();
  };

  // 🔒 GET /api/events - scoped list
  router.get("/", async (req, res) => {
    try {
      const me = req.me; // set by requireAuth in server.js
      const events = await prisma.event.findMany({
        where: scopedWhere(me.id),
        include: { course: true },
        orderBy: { date: "asc" },
      });
      res.json({ success: true, data: events });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 GET /api/events/courses - only courses you're a member of
  router.get("/courses", async (req, res) => {
    try {
      const me = req.me;
      const courses = await prisma.course.findMany({
        where: { members: { some: { userId: me.id } } },
        include: {
          _count: { select: { events: true } },
        },
        orderBy: { id: "asc" },
      });
      res.json({ success: true, data: courses });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 GET /api/events/stats - scoped aggregates
  router.get("/stats", async (req, res) => {
    try {
      const me = req.me;
      const where = scopedWhere(me.id);

      const [totalEvents, totalCourses, upcomingEvents, sample] = await Promise.all([
        prisma.event.count({ where }),
        prisma.course.count({ where: { members: { some: { userId: me.id } } } }),
        prisma.event.count({ where: { ...where, date: { gte: new Date() } } }),
        prisma.event.findMany({ where, select: { type: true, importance: true } }),
      ]);

      const eventsByType = sample.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {});
      const eventsByImportance = sample.reduce((acc, e) => {
        acc[e.importance] = (acc[e.importance] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalEvents,
          totalCourses,
          upcomingEvents,
          eventsByType: Object.entries(eventsByType).map(([type, count]) => ({ type, count })),
          eventsByImportance: Object.entries(eventsByImportance).map(([importance, count]) => ({ importance, count })),
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 GET /api/events/deadlines - scoped upcoming exam/assignment
  router.get("/deadlines", async (req, res) => {
    try {
      const me = req.me;
      const daysAhead = parseInt(req.query.days) || 7;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const deadlines = await prisma.event.findMany({
        where: {
          ...scopedWhere(me.id),
          date: { gte: new Date(), lte: endDate },
          type: { in: ["exam", "assignment"] },
        },
        include: { course: true },
        orderBy: { date: "asc" },
      });

      res.json({ success: true, data: deadlines });
    } catch (error) {
      console.error("Error fetching deadlines:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 GET /api/events/date/:date - scoped by exact date
  router.get("/date/:date", async (req, res) => {
    try {
      const me = req.me;
      const { date } = req.params;
      const targetDate = new Date(date);

      const events = await prisma.event.findMany({
        where: { ...scopedWhere(me.id), date: targetDate },
        include: { course: true },
        orderBy: { time: "asc" },
      });

      res.json({ success: true, data: events });
    } catch (error) {
      console.error("Error fetching events for date:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 GET /api/events/course/:courseId - enforce membership
  router.get("/course/:courseId", async (req, res) => {
    try {
      const me = req.me;
      const { courseId } = req.params;

      const membership = await getMembership(me.id, courseId);
      if (!membership) return res.status(403).json({ success: false, error: "Forbidden" });

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { events: { orderBy: { date: "asc" } } },
      });
      if (!course) return res.status(404).json({ success: false, error: "Course not found" });

      res.json({ success: true, data: course });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 POST /api/events - create (must be member/editor unless global)
  router.post("/", validateEvent, async (req, res) => {
    try {
      const me = req.me;
      const { date, courseId, ...eventData } = req.body;

      // Handle "admin" pseudo-course → null (global). Lock this down if needed.
      const resolvedCourseId = courseId === "admin" ? null : courseId;

      if (resolvedCourseId) {
        await assertEditor(me.id, resolvedCourseId);
        // also verify the course exists
        const exists = await prisma.course.findUnique({ where: { id: resolvedCourseId } });
        if (!exists) return res.status(400).json({ success: false, error: "Invalid course ID" });
      } else {
        // Optional: restrict global events to owners via env flag
        if (process.env.ALLOW_GLOBAL_EVENTS !== "true") {
          return res.status(403).json({ success: false, error: "Global events not allowed" });
        }
      }

      const newEvent = await prisma.event.create({
        data: {
          title: eventData.title,
          courseId: resolvedCourseId,
          type: eventData.type,
          date: new Date(date),
          time: eventData.time || "12:00 PM",
          location: eventData.location || "TBD",
          description: eventData.description || "",
          importance: eventData.importance || "Medium",
          preparation: eventData.preparation || [],
          createdById: me.id, // 🔒 ownership
        },
        include: { course: true },
      });

      res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 PUT /api/events/:id - update (must be editor on course)
  router.put("/:id", async (req, res) => {
    try {
      const me = req.me;
      const eventId = parseInt(req.params.id, 10);

      const existing = await prisma.event.findUnique({ where: { id: eventId } });
      if (!existing) return res.status(404).json({ success: false, error: "Event not found" });

      // Editing current course?
      if (existing.courseId) await assertEditor(me.id, existing.courseId);

      // If moving to another course, check that too
      const { date, courseId, ...updatedData } = req.body;
      if (courseId !== undefined) {
        const nextCourseId = courseId === "admin" ? null : courseId;
        if (nextCourseId) await assertEditor(me.id, nextCourseId);
        updatedData.courseId = nextCourseId;
      }
      if (date) updatedData.date = new Date(date);

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: updatedData,
        include: { course: true },
      });

      res.json({ success: true, message: "Event updated successfully", data: updated });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  // 🔒 DELETE /api/events/:id - delete (must be editor)
  router.delete("/:id", async (req, res) => {
    try {
      const me = req.me;
      const eventId = parseInt(req.params.id, 10);

      const existing = await prisma.event.findUnique({ where: { id: eventId } });
      if (!existing) return res.status(404).json({ success: false, error: "Event not found" });

      if (existing.courseId) await assertEditor(me.id, existing.courseId);

      await prisma.event.delete({ where: { id: eventId } });
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(error.status || 500).json({ success: false, error: error.message });
    }
  });

  router.get('/me', (req, res) => {
    res.json({ me: req.me });
  });

  // list events (scoped example — adjust for your schema)
  router.get('/', async (req, res) => {
    try {
      // example: all events for this professor's courses
      // tweak to your actual Prisma models/relations
      const prof = await prisma.professor.findUnique({
        where: { email: (req.me.email || '').toLowerCase() }
      });
      if (!prof) return res.status(403).json({ error: 'No professor record' });

      const events = await prisma.event.findMany({
        where: { professorId: prof.id },
        orderBy: [{ date: 'asc' }, { time: 'asc' }]
      });

      res.json(events);
    } catch (err) {
      console.error('events list failed:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // create event (example)
  router.post('/', async (req, res) => {
    try {
      const prof = await prisma.professor.findUnique({
        where: { email: (req.me.email || '').toLowerCase() }
      });
      if (!prof) return res.status(403).json({ error: 'No professor record' });

      const { title, date, time, location, description, courseId, type, importance } = req.body;

      const event = await prisma.event.create({
        data: {
          title,
          date: new Date(date),
          time,
          location,
          description,
          type,
          importance,
          courseId,
          professorId: prof.id
        }
      });
      res.status(201).json(event);
    } catch (err) {
      console.error('event create failed:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

