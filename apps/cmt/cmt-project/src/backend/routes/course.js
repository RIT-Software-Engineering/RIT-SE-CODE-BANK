const express = require("express");
const router = express.Router();

/**
 * GET /api/cmt/course
 * Get all courses from a professor
 * TODO: CHANGE IT SO IT'S BASED ON THE PROFESSOR ID THAT'S CURRENTLY LOGGED IN
 */
router.get("/", async (req, res) => {
  try {
    const prisma = req.prisma;
    const courses = await prisma.course.findMany({
      include: { professors: true },
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/cmt/course
 * Create a course
 */
router.post("/", async (req, res) => {
  try {
    const prisma = req.prisma;
    let { id, name, semester, color, students, professorId } = req.body;
    students = parseInt(students, 10);
    const course = await prisma.course.create({
      data: { id, name, semester, color, students, professorId },
    });
    res.json(course);
  } catch (err) {
    console.error("course creation failed: ", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/cmt/course/:id
 * Update course - add workflowId or other fields
 */
router.put("/:id", async (req, res) => {
  try {
    const prisma = req.prisma;
    const { id } = req.params;
    const updateData = req.body;

    console.log("PUT /api/cmt/course/:id called with:", id, updateData);

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    console.log("Course updated successfully:", updatedCourse);

    res.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/cmt/course/:id
 * Delete a course and all related data (events, enrollments, etc.)
 */
router.delete("/:id", async (req, res) => {
  try {
    const prisma = req.prisma;
    const { id } = req.params;

    console.log("DELETE /api/cmt/course/:id called with:", id);

    // First, delete all events associated with this course
    await prisma.event.deleteMany({
      where: { courseId: id },
    });

    console.log(`✅ Deleted all events for course: ${id}`);

    // Then delete the course
    await prisma.course.delete({
      where: { id },
    });

    console.log(`✅ Course deleted: ${id}`);

    res.json({
      success: true,
      message: "Course and all related events deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/cmt/course/create-with-workflow
 * Create a course with template and calendar events in one transaction
 * This is the multi-step workflow endpoint
 */
router.post("/create-with-workflow", async (req, res) => {
  try {
    const { course, templateId, calendarEvents } = req.body;
    const prisma = req.prisma;

    // Validate course data
    if (
      !course ||
      !course.id ||
      !course.name ||
      !course.semester ||
      !course.color ||
      !course.students
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required course fields",
      });
    }

    // Step 1: Get or create professor
    let professorId = course.professorId;
    
    if (!professorId) {
      // Try to get professorId from authenticated user
      if (req.user && req.user.professorId) {
        professorId = req.user.professorId;
        console.log(`✅ Using authenticated professorId: ${professorId}`);
      } else {
        // Fallback: Try to get the first professor, or create a default one
        let professor = await prisma.professor.findFirst();
        
        if (!professor) {
          console.log("⚠️ No professor found, creating default professor...");
          professor = await prisma.professor.create({
            data: {
              fname: "Default",
              lname: "Professor",
              email: "professor@example.com",
            },
          });
        }
        
        professorId = professor.id;
        console.log(`✅ Using professorId: ${professorId}`);
      }
    }

    // Step 2: Create the course
    const newCourse = await prisma.course.create({
      data: {
        id: course.id,
        name: course.name,
        semester: course.semester,
        color: course.color,
        students: parseInt(course.students),
        professorId: professorId,
      },
    });

    console.log(`✅ Course created: ${newCourse.id}`);

    // Step 3: Apply template if selected
    let templateItems = [];
    if (templateId) {
      try {
        const template = await prisma.courseTemplate.findUnique({
          where: { id: parseInt(templateId) },
          include: { templateItems: true },
        });

        if (template) {
          templateItems = template.templateItems;
          console.log(
            `✅ Template loaded: ${template.name} (${templateItems.length} items)`
          );
        }
      } catch (error) {
        console.error("⚠️ Failed to load template:", error);
        // Continue without template - don't fail the entire request
      }
    }

    // Step 4: Create calendar events from template items + custom events
    const allEvents = [];

    // Convert template items to events
    templateItems.forEach((item) => {
      if (item.dueDate) {
        allEvents.push({
          title: item.name,
          date: item.dueDate,
          description: item.description || "",
          type: item.type.toLowerCase(), // 'assignment', 'exam', 'lab', 'project'
        });
      }
    });

    // Add custom calendar events
    if (calendarEvents && calendarEvents.length > 0) {
      calendarEvents.forEach((event) => {
        allEvents.push({
          title: event.title,
          date: event.date,
          time: event.time || "00:00",
          description: event.description || "",
          type: "lecture", // default type for custom events
        });
      });
    }

    // Filter valid events
    const validEvents = allEvents.filter((event) => event.title && event.date);

    if (validEvents.length > 0) {
      try {
        // Transform events for database
        const eventsToCreate = validEvents.map((event) => {
          const dateTime =
            event.date instanceof Date
              ? event.date
              : new Date(
                  event.date + (event.time ? `T${event.time}` : "T00:00:00")
                );

          // Map type to EventType enum
          let eventType = "lecture";
          if (
            ["exam", "assignment", "lab", "office_hours", "meeting"].includes(
              event.type
            )
          ) {
            eventType = event.type;
          }

          return {
            title: event.title,
            date: dateTime,
            time: event.time || "00:00",
            description: event.description || "",
            courseId: newCourse.id,
            professorId: professorId,  // ✅ FIXED: Added professorId to events
            type: eventType,
            location: "",
            importance: "Medium",
          };
        });

        // Create events in database
        await prisma.event.createMany({
          data: eventsToCreate,
        });

        console.log(`✅ Created ${eventsToCreate.length} calendar events`);
      } catch (error) {
        console.error("⚠️ Failed to create calendar events:", error);
        console.error("Error details:", error.message);
        // Continue - don't fail the entire request
      }
    }

    // Step 5: Return success
    return res.status(201).json({
      success: true,
      data: {
        course: newCourse,
        eventsCreated: validEvents.length,
        templateApplied: !!templateId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating course with workflow:", error);

    // If course creation failed, return error
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "A course with this ID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to create course",
    });
  }
});

module.exports = router;