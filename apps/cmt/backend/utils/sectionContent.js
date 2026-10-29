import { randomUUID } from "node:crypto";
import { CMTError } from "@se-code-bank/cmt-shared-utilities";

export function sectionError(message, status = 400) {
    return Object.assign(new CMTError({userFacingMessage: message}), {status});
}

export async function ownedSection(tx, id, professorId) {
    if (!professorId) throw sectionError("Not authenticated", 401);
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw sectionError("Invalid section ID");
    const course = await tx.course.findFirst({where: {id: Number(id), professorId}});
    if (!course) throw sectionError("Section not found for this instructor", 404);
    return course;
}

export async function ownedSession(tx, id, professorId) {
    if (!professorId) throw sectionError("Not authenticated", 401);
    if (!Number.isSafeInteger(Number(id)) || Number(id) < 1) throw sectionError("Invalid session ID");
    const session = await tx.session.findFirst({
        where: {id: Number(id), course: {professorId}}, include: {course: true}
    });
    if (!session) throw sectionError("Session not found for this instructor", 404);
    return session;
}

async function targetSections(tx, source, all) {
    if (!all || !source.offeringId || source.isTemplate) return [source];
    return tx.course.findMany({
        where: {offeringId: source.offeringId, professorId: source.professorId, active: true, isTemplate: false},
        orderBy: {id: "asc"}
    });
}

async function correspondingSession(tx, source, target, block) {
    if (block?.sharedKey) {
        const counterpart = await tx.sessionBlock.findFirst({
            where: {sharedKey: block.sharedKey, session: {courseId: target.id}}, include: {session: true}
        });
        if (!counterpart) throw sectionError(`Section ${target.section || target.id} is missing the matching block. Apply the block to all sections first.`);
        return {session: counterpart.session, blockId: counterpart.id};
    }
    const session = target.id === source.courseId ? source : await tx.session.findFirst({
        where: {courseId: target.id, sharedKey: source.sharedKey}
    });
    if (!session) throw sectionError(`Section ${target.section || target.id} is missing the matching session.`);
    return {session, blockId: null};
}

export async function remapSectionResources(tx, sourceCourseId, targetCourseId, value) {
    if (!value || sourceCourseId === targetCourseId) return value;
    const resources = await tx.resource.findMany({where: {courseId: sourceCourseId}});
    let result = value;
    for (const resource of resources) {
        if (!result.includes(`/api/cmt/resources/download/${resource.id}`)) continue;
        const sharedKey = resource.sharedKey || randomUUID();
        if (!resource.sharedKey) await tx.resource.update({where: {id: resource.id}, data: {sharedKey}});
        let target = await tx.resource.findFirst({where: {courseId: targetCourseId, sharedKey}});
        if (!target) {
            const {name, filename, mimeType, filePath, isSyllabus} = resource;
            target = await tx.resource.create({data: {
                name, filename, mimeType, filePath, isSyllabus, sharedKey, courseId: targetCourseId
            }});
        }
        result = result.replaceAll(`/api/cmt/resources/download/${resource.id}`, `/api/cmt/resources/download/${target.id}`);
    }
    return result;
}

export async function createSectionBlock(prisma, professorId, {sessionId, name, applyToAll = false}) {
    if (typeof name !== "string" || !name.trim()) throw sectionError("Block name is required");
    return prisma.$transaction(async tx => {
        const source = await ownedSession(tx, sessionId, professorId);
        const targets = await targetSections(tx, source.course, applyToAll === true);
        const sharedKey = randomUUID();
        let created;
        for (const target of targets) {
            const {session} = await correspondingSession(tx, source, target);
            const position = await tx.sessionBlock.count({where: {sessionId: session.id}});
            const block = await tx.sessionBlock.create({data: {sessionId: session.id, name: name.trim(), position, sharedKey}});
            if (target.id === source.courseId) created = block;
        }
        return {block: created, courseId: source.courseId};
    });
}

export async function saveSectionMaterial(prisma, professorId, sessionId, item, materialId = null) {
    return prisma.$transaction(async tx => {
        const source = await ownedSession(tx, sessionId, professorId);
        const existing = materialId ? await tx.sessionMaterial.findFirst({
            where: {id: Number(materialId), session: {course: {professorId}}}, include: {session: true}
        }) : null;
        if (materialId && (!existing || existing.session.courseId !== source.courseId))
            throw sectionError("Material not found in this section", 404);
        const blockId = item.blockId === undefined ? existing?.blockId : item.blockId;
        const block = blockId ? await tx.sessionBlock.findFirst({where: {id: Number(blockId), sessionId: source.id}}) : null;
        if (blockId && !block) throw sectionError("Block does not belong to this session");
        const type = item.itemType ?? existing?.type;
        if (typeof item.itemLabel !== "string" || !item.itemLabel.trim() || typeof type !== "string")
            throw sectionError("Material type and title are required");
        const all = item.applyToAll === true && type !== "Personal Notes" && existing?.type !== "Personal Notes";
        const targets = await targetSections(tx, source.course, all);
        const sharedKey = existing?.sharedKey || randomUUID();
        let saved;
        for (const target of targets) {
            const destination = await correspondingSession(tx, source, target, block);
            const counterpart = existing && target.id === source.courseId ? existing : existing ? await tx.sessionMaterial.findFirst({
                where: {sharedKey, session: {courseId: target.id}}
            }) : null;
            const data = {
                type, sharedKey, label: await remapSectionResources(tx, source.courseId, target.id, item.itemLabel),
                body: await remapSectionResources(tx, source.courseId, target.id, item.itemBody ?? existing?.body ?? null),
                sessionId: destination.session.id, sessionNum: destination.session.sessionNum - 1,
                blockId: destination.blockId, active: true
            };
            const material = counterpart
                ? await tx.sessionMaterial.update({where: {id: counterpart.id}, data})
                : await tx.sessionMaterial.create({data});
            if (target.id === source.courseId) saved = material;
        }
        return {material: saved, courseId: source.courseId};
    }, {timeout: 15000});
}

export async function removeSectionBlock(prisma, professorId, blockId) {
    if (!professorId) throw sectionError("Not authenticated", 401);
    if (!Number.isSafeInteger(Number(blockId)) || Number(blockId) < 1)
        throw sectionError("Invalid block ID");
    return prisma.$transaction(async tx => {
        const block = await tx.sessionBlock.findFirst({
            where: {id: Number(blockId), session: {course: {professorId}}}, include: {session: true}
        });
        if (!block) throw sectionError("Block not found for this instructor", 404);
        await tx.sessionMaterial.updateMany({where: {blockId: block.id}, data: {blockId: null}});
        await tx.sessionBlock.delete({where: {id: block.id}});
        const remaining = await tx.sessionBlock.findMany({
            where: {sessionId: block.sessionId}, orderBy: [{position: "asc"}, {id: "asc"}]
        });
        for (const [position, item] of remaining.entries()) {
            await tx.sessionBlock.update({where: {id: item.id}, data: {position}});
        }
        return block.session.courseId;
    });
}

export async function shareSectionBlock(prisma, professorId, blockId) {
    return prisma.$transaction(async tx => {
        const block = await tx.sessionBlock.findFirst({
            where: {id: Number(blockId), session: {course: {professorId: professorId || ""}}},
            include: {material: true}
        });
        if (!block) throw sectionError("Block not found for this instructor", 404);
        const source = await ownedSession(tx, block.sessionId, professorId);
        const targets = await targetSections(tx, source.course, true);
        for (const target of targets.filter(section => section.id !== source.courseId)) {
            const existing = await tx.sessionBlock.findFirst({where: {sharedKey: block.sharedKey, session: {courseId: target.id}}});
            const {session} = existing
                ? {session: await tx.session.findUnique({where: {id: existing.sessionId}})}
                : await correspondingSession(tx, source, target);
            const copied = existing ? await tx.sessionBlock.update({where: {id: existing.id}, data: {name: block.name}}) : await tx.sessionBlock.create({data: {
                name: block.name, sharedKey: block.sharedKey, sessionId: session.id,
                position: await tx.sessionBlock.count({where: {sessionId: session.id}})
            }});
            for (const material of block.material.filter(item => item.active && item.type !== "Personal Notes")) {
                const counterpart = await tx.sessionMaterial.findFirst({where: {sharedKey: material.sharedKey, session: {courseId: target.id}}});
                const data = {
                    sharedKey: material.sharedKey, type: material.type, active: true,
                    sessionId: session.id, sessionNum: session.sessionNum - 1, blockId: copied.id,
                    label: await remapSectionResources(tx, source.courseId, target.id, material.label),
                    body: await remapSectionResources(tx, source.courseId, target.id, material.body)
                };
                if (counterpart) await tx.sessionMaterial.update({where: {id: counterpart.id}, data});
                else await tx.sessionMaterial.create({data});
            }
        }
        return source.courseId;
    }, {timeout: 15000});
}
