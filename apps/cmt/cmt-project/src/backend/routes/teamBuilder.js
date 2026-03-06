import express from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";

// Require that a user is logged in (authMiddleware should set req.user)
function requireUser(req, res) {
  if (!req.user) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return null;
  }
  return req.user;
}

// Map logged-in user -> Professor row (by email)
async function getProfessorForUser(prisma, req, res) {
  const user = requireUser(req, res);
  if (!user) return null;

  const professor = await prisma.professor.findFirst({
    where: { email: user.email },
  });

  if (!professor) {
    res.status(403).json({
      success: false,
      error: `No Professor found for email ${user.email}`,
    });
    return null;
  }

  return professor;
}

// Ensure a TeamSet belongs to this professor
async function ensureTeamSetOwnedByProfessor(prisma, teamSetId, professorId) {
  const teamSet = await prisma.TBTeamSet.findUnique({
    where: { id: Number(teamSetId) },
    include: { course: true },
  });

  if (!teamSet) return null;
  if (!teamSet.course || teamSet.course.professorId !== professorId) return null;

  return teamSet;
}

export default function makeTeamBuilderRouter(prisma) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  function shuffleDeterministic(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = ((i * 9301 + 49297) % 233280) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- LIST COURSES (only this prof's) ----------
  router.get("/", async (req, res) => {
    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const courses = await prisma.course.findMany({
        where: { professorId: professor.id },
        orderBy: [{ id: "asc" }],
        select: { id: true, professorId: true, name: true, year: true, season: true, classId: true },
      });

      res.json(courses);
    } catch (e) {
      console.error("List courses failed:", e);
      res.status(500).json({
        error: "Failed to list courses",
        detail: String(e.message || e),
      });
    }
  });

  // Upload roster CSV (expected headers: email, studentId, firstName, lastName)
  router.post(
    "/courses/:courseId/roster",
    upload.single("file"),
    async (req, res) => {
      const courseId = parseInt(req.params.courseId);

      try {
        const professor = await getProfessorForUser(prisma, req, res);
        if (!professor) return;

        // Make sure the course belongs to this professor
        const course = await prisma.course.findFirst({
          where: { id: courseId, professorId: professor.id },
        });
        if (!course) {
          return res.status(404).json({
            error: "Course not found for this instructor",
          });
        }

        if (!req.file) {
          return res
            .status(400)
            .json({ error: "CSV file required (field name: file)" });
        }

        let rows = [];
        try {
          rows = parse(req.file.buffer.toString("utf-8"), {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
        } catch (e) {
          console.error("CSV parsing failed:", e);
          return res.status(400).json({
            error: "Invalid CSV",
            detail: String(e.message || e),
          });
        }

        if (!Array.isArray(rows) || !rows.length) {
          return res.status(400).json({ error: "CSV is empty or invalid" });
        }

        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < rows.length; i++) {
            const line = rows[i];

            const studentId = (line["studentId"] || "").trim();
            const firstName = (line["firstName"] || "").trim();
            const lastName = (line["lastName"] || "").trim();
            const email = (line["email"] || "").trim();

            if (!studentId) {
              console.warn(`Skipping row ${i + 1}: missing studentId`, line);
              continue;
            }

            await tx.TBEnrollment.upsert({
              where: { courseId_studentId: { courseId, studentId } },
              update: {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                email: email || undefined,
              },
              create: {
                courseId,
                studentId,
                firstName: firstName || null,
                lastName: lastName || null,
                email: email || null,
              },
            });
          }
        });

        const roster = await prisma.TBEnrollment.findMany({
          where: { courseId },
          orderBy: { id: "asc" },
        });
        res.json({ count: roster.length, roster });
      } catch (e) {
        console.error("Roster import failed:", e);
        res.status(500).json({
          error: "Roster import failed",
          detail: e.message || e,
        });
      }
    }
  );

  // ---------- GENERATE TEAMSET (for this prof + course) ----------
  // POST /api/team-builder/courses/:courseId/teamsets
  router.post("/courses/:courseId/teamsets", async (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const { name, teamSize = 4 } = req.body || {};
    if (!name) return res.status(400).json({ error: "name required" });

    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      // Ensure course belongs to this professor
      const course = await prisma.course.findFirst({
        where: { id: courseId, professorId: professor.id },
      });
      if (!course) {
        return res.status(404).json({
          error: "Course not found for this instructor",
        });
      }

      const enrollments = await prisma.TBEnrollment.findMany({
        where: { courseId },
      });
      if (!enrollments.length) {
        return res
          .status(400)
          .json({ error: "No enrollments for this course" });
      }

      const students = shuffleDeterministic(enrollments);
      const teamCount = Math.ceil(students.length / Number(teamSize));

      const data = await prisma.$transaction(async (tx) => {
        const teamSet = await tx.TBTeamSet.create({
          data: {
            courseId,
            name,
            status: "DRAFT",
            teamSize: Number(teamSize),
            createdByProfessorId: professor.id, // from logged-in user
          },
        });

        const teams = await Promise.all(
          Array.from({ length: teamCount }).map((_, i) =>
            tx.TBTeam.create({
              data: {
                teamSetId: teamSet.id,
                name: `Team ${i + 1}`,
                maxSize: Number(teamSize),
              },
            })
          )
        );

        for (let i = 0; i < students.length; i++) {
          const t = teams[i % teamCount];
          await tx.TBMember.create({
            data: { teamId: t.id, enrollmentId: students[i].id },
          });
        }

        return tx.TBTeamSet.findUnique({
          where: { id: teamSet.id },
          include: {
            teams: { include: { members: { include: { enrollment: true } } } },
          },
        });
      });

      res.json(data);
    } catch (e) {
      console.error("Generate teams failed:", e);
      res.status(500).json({
        error: "Generate teams failed",
        detail: String(e.message || e),
      });
    }
  });

  // ---------- LIST TEAMSETS FOR A COURSE (only this prof's) ----------
  router.get("/courses/:courseId/teamsets", async (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const status = req.query.status;

    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const where = {
        courseId,
        createdByProfessorId: professor.id,
      };
      if (status) where.status = status;

      const sets = await prisma.TBTeamSet.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        include: {
          teams: { include: { members: { include: { enrollment: true } } } },
        },
      });
      res.json(sets);
    } catch (e) {
      console.error("List team sets failed:", e);
      res.status(500).json({
        error: "Failed to list team sets",
        detail: String(e.message || e),
      });
    }
  });

  // Publish
  router.patch("/teamsets/:id/publish", async (req, res) => {
    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const existing = await ensureTeamSetOwnedByProfessor(
        prisma,
        req.params.id,
        professor.id
      );
      if (!existing) {
        return res
          .status(404)
          .json({ error: "TeamSet not found for this instructor" });
      }

      const set = await prisma.TBTeamSet.update({
        where: { id: existing.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
        include: {
          teams: {
            include: {
              members: {
                include: { enrollment: true },
              },
            },
          },
        },
      });
      res.json(set);
    } catch (e) {
      console.error("Publish failed:", e);
      res.status(500).json({ error: "Failed to publish team set" });
    }
  });

  // Unpublish
  router.patch("/teamsets/:id/unpublish", async (req, res) => {
    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const existing = await ensureTeamSetOwnedByProfessor(
        prisma,
        req.params.id,
        professor.id
      );
      if (!existing) {
        return res
          .status(404)
          .json({ error: "TeamSet not found for this instructor" });
      }

      const set = await prisma.TBTeamSet.update({
        where: { id: existing.id },
        data: { status: "DRAFT", publishedAt: null },
      });
      res.json(set);
    } catch (e) {
      console.error("Unpublish failed:", e);
      res.status(500).json({ error: "Failed to unpublish team set" });
    }
  });

  // Archive
  router.patch("/teamsets/:id/archive", async (req, res) => {
    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const existing = await ensureTeamSetOwnedByProfessor(
        prisma,
        req.params.id,
        professor.id
      );
      if (!existing) {
        return res
          .status(404)
          .json({ error: "TeamSet not found for this instructor" });
      }

      const set = await prisma.TBTeamSet.update({
        where: { id: existing.id },
        data: { status: "ARCHIVED" },
      });
      res.json(set);
    } catch (e) {
      console.error("Archive failed:", e);
      res.status(500).json({ error: "Failed to archive team set" });
    }
  });

  // Edit (reopen for editing)
  router.put("/teamsets/:id/edit", async (req, res) => {
    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const existing = await ensureTeamSetOwnedByProfessor(
        prisma,
        req.params.id,
        professor.id
      );
      if (!existing) {
        return res
          .status(404)
          .json({ error: "TeamSet not found for this instructor" });
      }

      const updated = await prisma.TBTeamSet.update({
        where: { id: existing.id },
        data: { status: "DRAFT" },
        include: {
          teams: { include: { members: { include: { enrollment: true } } } },
        },
      });
      res.json(updated);
    } catch (e) {
      console.error("Edit failed:", e);
      res
        .status(500)
        .json({ error: "Failed to reopen team set for editing" });
    }
  });

  // Move a member within a TeamSet
  router.post("/teamsets/:id/move", async (req, res) => {
    const teamSetId = Number(req.params.id);
    const { enrollmentId, toTeamId } = req.body || {};
    if (!enrollmentId || !toTeamId)
      return res
        .status(400)
        .json({ error: "enrollmentId and toTeamId required" });

    try {
      const professor = await getProfessorForUser(prisma, req, res);
      if (!professor) return;

      const existing = await ensureTeamSetOwnedByProfessor(
        prisma,
        teamSetId,
        professor.id
      );
      if (!existing) {
        return res
          .status(404)
          .json({ error: "TeamSet not found for this instructor" });
      }

      const toTeam = await prisma.TBTeam.findFirst({
        where: { id: Number(toTeamId), teamSetId },
      });
      if (!toTeam)
        return res
          .status(400)
          .json({ error: "Target team not in this TeamSet" });

      const teamIds = (
        await prisma.TBTeam.findMany({
          where: { teamSetId },
          select: { id: true },
        })
      ).map((t) => t.id);

      await prisma.$transaction(async (tx) => {
        await tx.TBMember.deleteMany({
          where: { enrollmentId: Number(enrollmentId), teamId: { in: teamIds } },
        });
        await tx.TBMember.create({
          data: { teamId: Number(toTeamId), enrollmentId: Number(enrollmentId) },
        });
      });

      const updated = await prisma.TBTeamSet.findUnique({
        where: { id: teamSetId },
        include: {
          teams: { include: { members: { include: { enrollment: true } } } },
        },
      });
      res.json(updated);
    } catch (e) {
      console.error("Move member failed:", e);
      res.status(500).json({ error: "Failed to move member" });
    }
  });

  return router;
};