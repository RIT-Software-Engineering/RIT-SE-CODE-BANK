const DAY_MS = 86400000;

function monday(date) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const value = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(value.getTime())) return null;
    value.setUTCDate(value.getUTCDate() - (value.getUTCDay() + 6) % 7);
    return value.getTime();
}

export function teachingWeek(session, anchor) {
    const date = monday(session.date);
    const start = monday(anchor);
    if (date !== null && start !== null) return Math.floor((date - start) / (7 * DAY_MS)) + 1;
    return session.teachingWeek ?? null;
}

export function sectionLabel(section) {
    return section.section || `Course ${section.id}`;
}

// Resource IDs differ between sections even when they refer to the same copied file.
export function normalizedMaterial(material, resources) {
    const normalize = value => {
        let result = value || "";
        for (const resource of resources) {
            result = result.replaceAll(`/api/cmt/resources/download/${resource.id}`,
                `/api/cmt/resources/download/${resource.sharedKey || resource.id}`);
        }
        return result;
    };
    return JSON.stringify([material.type, normalize(material.label), normalize(material.body)]);
}

export function compareSections(sections, anchor) {
    if (sections.length < 2) return [];
    const issues = [];
    const blocks = new Map();
    const materials = new Map();
    const add = (map, key, value) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(value);
    };
    const describe = (section, session) => ({
        courseId: section.id, section: sectionLabel(section), sessionId: session?.id ?? null,
        sessionNum: session?.sessionNum ?? null, week: session ? teachingWeek(session, anchor) : null
    });
    const issue = (key, kind, label, message, entries, review) => issues.push({
        issueKey: key,
        details: {kind, label, message, sections: entries,
            reviewCourseId: review.courseId, reviewSessionNum: review.sessionNum ?? null}
    });

    for (const section of sections) {
        for (const session of section.sessions) {
            const position = teachingWeek(session, anchor) ?? `session:${session.sharedKey || session.sessionNum}`;
            for (const block of session.blocks) {
                add(blocks, block.sharedKey || `block:${block.id}`, {
                    ...describe(section, session), status: block.status, label: block.name, position
                });
            }
            for (const material of session.material.filter(item => item.active && item.type !== "Personal Notes")) {
                add(materials, material.sharedKey || `material:${material.id}`, {
                    ...describe(section, session), label: material.type, position,
                    content: normalizedMaterial(material, section.Resource || [])
                });
            }
            const unfinished = session.blocks.some(block => block.status !== "COMPLETED") ||
                session.material.some(item => item.active && item.type !== "Personal Notes" && !item.blockId);
            if (session.canceled && unfinished) {
                const entry = describe(section, session);
                issue(`canceled:${session.id}`, "cancellation", `Session ${session.sessionNum}`,
                    `Section ${sectionLabel(section)} has unfinished work in canceled session ${session.sessionNum}.`,
                    [entry], entry);
            }
        }
    }

    for (const [key, entries] of blocks) {
        const completed = entries.filter(entry => entry.status === "COMPLETED");
        const incomplete = entries.filter(entry => entry.status !== "COMPLETED");
        if (completed.length && incomplete.length) {
            issue(`completion:${key}`, "completion", entries[0].label,
                `Section ${incomplete.map(entry => entry.section).join(", ")} has not completed "${entries[0].label}"; section ${completed.map(entry => entry.section).join(", ")} has.`,
                entries, incomplete[0]);
        }
    }

    for (const [kind, map] of [["block-plan", blocks], ["material-plan", materials]]) {
        for (const [key, entries] of map) {
            const missing = sections.filter(section => !entries.some(entry => entry.courseId === section.id))
                .map(section => ({...describe(section), missing: true}));
            const signatures = new Set(entries.map(entry => JSON.stringify(
                [entry.position, kind === "block-plan" ? entry.label : entry.content]
            )));
            if (missing.length || signatures.size > 1) {
                issue(`${kind}:${key}`, "plan", entries[0].label,
                    missing.length
                        ? `The weekly plan differs: section ${missing.map(entry => entry.section).join(", ")} is missing a planned ${kind === "block-plan" ? "block" : "material item"}.`
                        : `Sections have different content or teaching weeks for a planned ${kind === "block-plan" ? "block" : "material item"}.`,
                    [...entries, ...missing], missing[0] || entries[0]);
            }
        }
    }
    return issues;
}

export async function refreshSectionSync(prisma, courseId) {
    const course = await prisma.course.findUnique({where: {id: Number(courseId)}});
    if (!course?.offeringId || course.isTemplate) return {sections: course ? [course] : [], issues: []};
    return prisma.$transaction(async tx => {
        // Serialize comparison and dismissal updates for an offering across tabs/requests.
        await tx.$queryRaw`SELECT id FROM CourseOffering WHERE id = ${course.offeringId} FOR UPDATE`;
        const offering = await tx.courseOffering.findUnique({where: {id: course.offeringId}});
        const sections = await tx.course.findMany({
            where: {offeringId: offering.id, professorId: offering.professorId, active: true, isTemplate: false},
            include: {sessions: {include: {blocks: true, material: true}}, Resource: true},
            orderBy: {id: "asc"}
        });
        const anchor = offering.startDate || sections.map(section => section.startDate).filter(Boolean).sort()[0];
        const current = compareSections(sections, anchor);
        const previous = await tx.sectionSyncIssue.findMany({where: {offeringId: offering.id}});
        for (const item of current) {
            const old = previous.find(entry => entry.issueKey === item.issueKey);
            await tx.sectionSyncIssue.upsert({
                where: {offeringId_issueKey: {offeringId: offering.id, issueKey: item.issueKey}},
                create: {offeringId: offering.id, ...item},
                update: {...item, resolved: false, ...(old?.resolved && {dismissedAt: null, occurrence: {increment: 1}})}
            });
        }
        await tx.sectionSyncIssue.updateMany({
            where: {offeringId: offering.id, resolved: false, issueKey: {notIn: current.map(item => item.issueKey)}},
            data: {resolved: true}
        });
        const issues = await tx.sectionSyncIssue.findMany({
            where: {offeringId: offering.id, resolved: false}, orderBy: {id: "asc"}
        });
        return {
            offeringId: offering.id,
            sections: sections.map(({id, section, days, startDate}) => ({id, section, days, startDate})),
            inSync: issues.length === 0,
            issues
        };
    }, {timeout: 15000});
}
