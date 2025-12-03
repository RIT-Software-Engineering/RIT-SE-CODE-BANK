const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const validateEvent = (req, res, next) => {
  const { title, courseId, type, date } = req.body;

  if (!title || !courseId || !type || !date) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["title", "courseId", "type", "date"],
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      error: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  // Validate event type
  const validTypes = [
    "exam",
    "assignment",
    "lecture",
    "lab",
    "office_hours",
    "meeting",
  ];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid event type",
      validTypes,
    });
  }

  // Validate importance
  if (req.body.importance) {
    const validImportance = ["Low", "Medium", "High"];
    if (!validImportance.includes(req.body.importance)) {
      return res.status(400).json({
        error: "Invalid importance level",
        validImportance,
      });
    }
  }

  next();
};

// Helper: require a logged-in user
function requireUser(req, res) {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return null;
  }
  return req.user;
}

// GET /api/events - Get all events with course information (for this user)
// Helper: require a logged-in user
function requireUser(req, res) {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return null;
  }
  return req.user;
}

// GET /api/events - Get all events with course information (for this user)
router.get("/", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const events = await prisma.event.findMany({
      where: {
        ownerUid: user.uid,
      },
      include: {
        course: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/events/courses - Get all courses
router.get("/courses", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const courses = await prisma.course.findMany({
      where: {
        events: {
          some: {
            ownerUid: user.uid,
          },
        },
      },
      include: {
        _count: {
          select: { events: true }, // Count events per course
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/events/stats - Get statistics for this user
router.get("/stats", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const uid = user.uid;

    const totalEvents = await prisma.event.count({
      where: { ownerUid: uid },
    });

    const totalCourses = await prisma.course.count({
      where: {
        events: {
          some: {
            ownerUid: uid,
          },
        },
      },
    });

    const eventsByType = await prisma.event.groupBy({
      by: ["type"],
      where: { ownerUid: uid },
      _count: {
        id: true,
      },
    });

    const eventsByImportance = await prisma.event.groupBy({
      by: ["importance"],
      where: { ownerUid: uid },
      _count: {
        id: true,
      },
    });

    const upcomingEvents = await prisma.event.count({
      where: {
        ownerUid: uid,
        date: {
          gte: new Date(),
        },
      },
    });

    const stats = {
      totalEvents,
      totalCourses,
      upcomingEvents,
      eventsByType: eventsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      eventsByImportance: eventsByImportance.map((item) => ({
        importance: item.importance,
        count: item._count.id,
      })),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/events/deadlines - Get upcoming deadlines for this user
router.get("/deadlines", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const deadlines = await prisma.event.findMany({
      where: {
        ownerUid: user.uid,
        date: {
          gte: new Date(),
          lte: endDate,
        },
        type: {
          in: ["exam", "assignment"],
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    res.json({
      success: true,
      data: deadlines,
    });
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/events/date/:date - Get events for specific date (for this user)
router.get("/date/:date", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    const events = await prisma.event.findMany({
      where: {
        ownerUid: user.uid,
        date: targetDate,
      },
      include: {
        course: true,
      },
      orderBy: {
        time: "asc",
      },
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events for date:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/events/course/:courseId - Get course by ID with this user's events
router.get("/course/:courseId", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        events: {
          where: {
            ownerUid: user.uid,
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/events - Create new event for this user
router.post("/", validateEvent, async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const { date, courseId, ...eventData } = req.body;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course && courseId !== "admin") {
      return res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
    }

    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        courseId: courseId === "admin" ? null : courseId,
        type: eventData.type,
        date: new Date(date),
        time: eventData.time || "12:00 PM",
        location: eventData.location || "TBD",
        description: eventData.description || "",
        importance: eventData.importance || "Medium",
        ownerUid: user.uid,
        ownerEmail: user.email,
      },
      include: {
        course: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /api/events/:id - Update existing event
router.put("/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { date, courseId, ...updatedData } = req.body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // If courseId is being updated, verify it exists
    if (courseId && courseId !== "admin") {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
      }
    }

    const updateData = {
      ...updatedData,
      ...(courseId !== undefined && {
        courseId: courseId === "admin" ? null : courseId,
      }),
      ...(date && { date: new Date(date) }),
    };

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        course: true,
      },
    });

    res.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/events/:id - Delete event
router.delete("/:id", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const eventId = parseInt(req.params.id);

    // Check if event exists & belongs to this user
    const existingEvent = await prisma.event.findFirst({
      where: { id: eventId, ownerUid: user.uid },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = router;
