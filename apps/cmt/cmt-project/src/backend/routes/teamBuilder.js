// src/backend/routes/teamBuilder.js  (CommonJS only)
const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

module.exports = function makeTeamBuilderRouter(prisma) {
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

  // List courses
  router.get("/", async (_req, res) => {
    try {
      const courses = await prisma.course.findMany({
        orderBy: [{ id: "asc" }],
        select: { id: true, professorId: true },
      });
      res.json(courses);
    } catch (e) {
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
      const courseId = req.params.courseId;
      if (!req.file)
        return res
          .status(400)
          .json({ error: "CSV file required (field name: file)" });

      let rows = [];
      try {
        rows = parse(req.file.buffer.toString("utf-8"), {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (e) {
        console.error("CSV parsing failed:", e);
        return res
          .status(400)
          .json({ error: "Invalid CSV", detail: String(e.message || e) });
      }

      if (!Array.isArray(rows) || !rows.length) {
        return res.status(400).json({ error: "CSV is empty or invalid" });
      }

      try {
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
        res
          .status(500)
          .json({ error: "Roster import failed", detail: e.message || e });
      }
    }
  );

  // Generate a TeamSet (draft)
  router.post("/courses/:courseId/teamsets", async (req, res) => {
    const courseId = req.params.courseId;
    const { name, teamSize = 4, createdByProfessorId } = req.body || {};
    if (!name) return res.status(400).json({ error: "name required" });
    if (!createdByProfessorId)
      return res.status(400).json({ error: "createdByProfessorId required" });

    try {
      const enrollments = await prisma.TBEnrollment.findMany({
        where: { courseId },
      });
      if (!enrollments.length)
        return res
          .status(400)
          .json({ error: "No enrollments for this course" });

      const students = shuffleDeterministic(enrollments);
      const teamCount = Math.ceil(students.length / Number(teamSize));

      console.log("creating teamset...");
      const data = await prisma.$transaction(async (tx) => {
        const teamSet = await tx.TBTeamSet.create({
          data: {
            courseId,
            name,
            status: "DRAFT",
            teamSize: Number(teamSize),
            createdByProfessorId: Number(createdByProfessorId),
          },
        });

        console.log("creating teams..");
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

        console.log("assigning members...");
        for (let i = 0; i < students.length; i++) {
          const t = teams[i % teamCount];
          await tx.TBMember.create({
            data: { teamId: t.id, enrollmentId: students[i].id },
          });
        }

        console.log("fetching full teamset...");
        return tx.TBTeamSet.findUnique({
          where: { id: teamSet.id },
          include: {
            teams: { include: { members: { include: { tbenrollment: true } } } },
          },
        });
      });

      res.json(data);
    } catch (e) {
      res.status(500).json({
        error: "Generate teams failed",
        detail: String(e.message || e),
      });
    }
  });

  // List TeamSets for a course
  router.get("/courses/:courseId/teamsets", async (req, res) => {
    const courseId = req.params.courseId;
    const status = req.query.status;
    const where = { courseId };
    if (status) where.status = status;

    try {
      const sets = await prisma.TBTeamSet.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        include: {
          teams: { include: { members: { include: { tbenrollment: true } } } },
        },
      });
      res.json(sets);
    } catch (e) {
      res.status(500).json({
        error: "Failed to list team sets",
        detail: String(e.message || e),
      });
    }
  });

  // Publish
  router.patch("/teamsets/:id/publish", async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.TBTeamSet.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date(), archivedAt: null },
      include: {
        teams: {
          include: {
            members: {
              include: { tbenrollment: true },
            },
          },
        },
      },
    });
    res.json(set);
  });

  // Unpublish
  router.patch("/teamsets/:id/unpublish", async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.TBTeamSet.update({
      where: { id },
      data: { status: "DRAFT", publishedAt: null },
    });
    res.json(set);
  });

  // Archive
  router.patch("/teamsets/:id/archive", async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.TBTeamSet.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    res.json(set);
  });

  // Edit (reopen for editing)
  router.put("/teamsets/:id/edit", async (req, res) => {
    const { id } = req.params;
    try {
      const updated = await prisma.TBTeamSet.update({
        where: { id: Number(id) },
        data: { status: "DRAFT" },
        include: {
          teams: { include: { members: { include: { tbenrollment: true } } } },
        },
      });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reopen team set for editing" });
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

    const toTeam = await prisma.TBTeam.findFirst({
      where: { id: Number(toTeamId), teamSetId },
    });
    if (!toTeam)
      return res.status(400).json({ error: "Target team not in this TeamSet" });

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
        teams: { include: { members: { include: { tbenrollment: true } } } },
      },
    });
    res.json(updated);
  });

  return router;
};