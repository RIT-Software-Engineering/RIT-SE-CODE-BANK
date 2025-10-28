// src/backend/routes/teamBuilder.js  (CommonJS only)
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');

module.exports = function makeTeamBuilderRouter(prisma) {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  function shuffleDeterministic(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = (i * 9301 + 49297) % 233280 % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // List sections
  router.get('/sections', async (_req, res) => {
    try {
      const sections = await prisma.section.findMany({
        orderBy: [{ id: 'asc' }],
        select: { id: true, sectionNum: true, courseId: true, professorId: true },
      });
      res.json(sections);
    } catch (e) {
      res.status(500).json({ error: 'Failed to list sections', detail: String(e.message || e) });
    }
  });

  // Upload roster CSV (RIT format)
  // Expected headers: ID, Name (Last, First), Grade Basis, Units, Program and Plan, Level
  router.post('/team-builder/sections/:sectionId/roster', upload.single('file'), async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    if (!req.file) return res.status(400).json({ error: 'CSV file required (field name: file)' });

    let rows = [];
    try {
      rows = parse(req.file.buffer.toString('utf-8'), {
        columns: (headers) => headers.map(h => String(h).trim()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid CSV', detail: String(e.message || e) });
    }

    const splitName = (nameLF) => {
      if (!nameLF) return { firstName: null, lastName: null };
      const parts = String(nameLF).split(',');
      const last = parts[0]?.trim() || null;
      const first = parts[1]?.trim() || null;
      return { firstName: first || null, lastName: last || null };
    };

    const normalize = (s) => (s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    const fallbackId = (first, last) => {
      const n = `${normalize(first)}|${normalize(last)}`;
      let h = 0;
      for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
      return `name:${h.toString(36)}`;
    };

    try {
      await prisma.$transaction(async (tx) => {
        for (const r of rows) {
          const rawId = r['ID'] ?? r['Id'] ?? r['id'] ?? null;
          const rawName = r['Name (Last, First)'] ?? r['Name'] ?? r['Student Name'] ?? null;

          const { firstName, lastName } = splitName(rawName);
          let studentId = rawId != null && String(rawId).trim() !== '' ? String(rawId).trim() : null;
          if (!studentId && (firstName || lastName)) {
            studentId = fallbackId(firstName || '', lastName || '');
          }
          if (!studentId && !firstName && !lastName) continue;

          await tx.tBEnrollment.upsert({
            where: { sectionId_studentId: { sectionId, studentId } },
            update: {
              firstName: firstName ?? undefined,
              lastName:  lastName  ?? undefined,
            },
            create: {
              sectionId,
              studentId,
              email: null,
              firstName: firstName ?? null,
              lastName:  lastName  ?? null,
            },
          });
        }
      });

      const roster = await prisma.tBEnrollment.findMany({ where: { sectionId }, orderBy: { id: 'asc' } });
      res.json({ count: roster.length, roster });
    } catch (e) {
      res.status(500).json({ error: 'Roster import failed', detail: String(e.message || e) });
    }
  });

  // Generate a TeamSet (draft)
  router.post('/team-builder/sections/:sectionId/teamsets', async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const { name, teamSize = 4, createdByProfessorId } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    if (!createdByProfessorId) return res.status(400).json({ error: 'createdByProfessorId required' });

    try {
      const enrollments = await prisma.tBEnrollment.findMany({ where: { sectionId } });
      if (!enrollments.length) return res.status(400).json({ error: 'No enrollments for this section' });

      const students = shuffleDeterministic(enrollments);
      const teamCount = Math.ceil(students.length / Number(teamSize));

      const data = await prisma.$transaction(async (tx) => {
        const teamSet = await tx.tBTeamSet.create({
          data: { sectionId, name, status: 'DRAFT', teamSize: Number(teamSize), createdByProfessorId: Number(createdByProfessorId) },
        });

        const teams = await Promise.all(
          Array.from({ length: teamCount }).map((_, i) =>
            tx.tBTeam.create({ data: { teamSetId: teamSet.id, name: `Team ${i + 1}`, maxSize: Number(teamSize) } })
          )
        );

        for (let i = 0; i < students.length; i++) {
          const t = teams[i % teamCount];
          await tx.tBMember.create({ data: { teamId: t.id, enrollmentId: students[i].id } });
        }

        return tx.tBTeamSet.findUnique({
          where: { id: teamSet.id },
          include: { teams: { include: { members: { include: { enrollment: true } } } } },
        });
      });

      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Generate teams failed', detail: String(e.message || e) });
    }
  });

  // List TeamSets for a Section
  router.get('/team-builder/sections/:sectionId/teamsets', async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const status = req.query.status;
    const where = { sectionId };
    if (status) where.status = status;

    try {
      const sets = await prisma.tBTeamSet.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        include: { teams: { include: { members: { include: { enrollment: true } } } } },
      });
      res.json(sets);
    } catch (e) {
      res.status(500).json({ error: 'Failed to list team sets', detail: String(e.message || e) });
    }
  });

  // Publish / Unpublish / Archive
  router.patch('/team-builder/teamsets/:id/publish', async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.tBTeamSet.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), archivedAt: null },
    });
    res.json(set);
  });
  router.patch('/team-builder/teamsets/:id/unpublish', async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.tBTeamSet.update({
      where: { id },
      data: { status: 'DRAFT', publishedAt: null },
    });
    res.json(set);
  });
  router.patch('/team-builder/teamsets/:id/archive', async (req, res) => {
    const id = Number(req.params.id);
    const set = await prisma.tBTeamSet.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    res.json(set);
  });

  // Move a member within a TeamSet
  router.post('/team-builder/teamsets/:id/move', async (req, res) => {
    const teamSetId = Number(req.params.id);
    const { enrollmentId, toTeamId } = req.body || {};
    if (!enrollmentId || !toTeamId) return res.status(400).json({ error: 'enrollmentId and toTeamId required' });

    const toTeam = await prisma.tBTeam.findFirst({ where: { id: Number(toTeamId), teamSetId } });
    if (!toTeam) return res.status(400).json({ error: 'Target team not in this TeamSet' });

    const teamIds = (await prisma.tBTeam.findMany({ where: { teamSetId }, select: { id: true } })).map(t => t.id);

    await prisma.$transaction(async (tx) => {
      await tx.tBMember.deleteMany({ where: { enrollmentId: Number(enrollmentId), teamId: { in: teamIds } } });
      await tx.tBMember.create({ data: { teamId: Number(toTeamId), enrollmentId: Number(enrollmentId) } });
    });

    const updated = await prisma.tBTeamSet.findUnique({
      where: { id: teamSetId },
      include: { teams: { include: { members: { include: { enrollment: true } } } } },
    });
    res.json(updated);
  });

  router.get('/courses', async (req, res) => {
    try {
      const prof = await prisma.professor.findUnique({
        where: { email: (req.me.email || '').toLowerCase() }
      });
      if (!prof) return res.status(403).json({ error: 'No professor record' });

      const courses = await prisma.courseCreation.findMany({
        where: { professorId: prof.id },
        include: { sections: true }
      });

      res.json(courses);
    } catch (err) {
      console.error('courses fetch failed:', err);
      res.status(500).json({ error: err.message });
    }
  });


  return router;
};
