import { workflowsFetch } from "@se-code-bank/cmt-shared-utilities";
import { accessError, resolveSectionIdentity, sectionAccess } from "./sectionPermissions.js";

export async function authorizeWorkflow(prisma, user, workflowId, {readOnly = false} = {}) {
    if (typeof workflowId !== "string" || !workflowId) throw accessError("Invalid workflow ID", 400);
    const courses = await prisma.course.findMany({where: {workflowId}});
    if (courses.length) {
        if (readOnly && courses.every(course => course.active && course.isTemplate)) {
            const definition = await workflowsFetch("GET", `workflows/${encodeURIComponent(workflowId)}`);
            if (definition.tags?.includes("TangledUpInLiesImAWorkflony")) return;
        }
        for (const course of courses) await sectionAccess(prisma, user, course.id, "editMaterials");
        return;
    }
    const {professorId} = await resolveSectionIdentity(prisma, user);
    const workflow = await workflowsFetch("GET", `workflows/${encodeURIComponent(workflowId)}`);
    if (readOnly && workflow.tags?.some(tag => ["WorkflonyFirstTheRestNowhere_CMT_Template", "TangledUpInLiesImAWorkflony"].includes(tag))) return;
    if (!professorId || !workflow.baseAction?.permissions?.some(permission =>
        permission.userId === professorId && permission.permissionType === "creator"))
        throw accessError("Workflow is not owned by this instructor");
}

export async function authorizeWorkflowAction(prisma, user, actionId) {
    if (typeof actionId !== "string" || !actionId) throw accessError("Invalid action ID", 400);
    const {professorId} = await resolveSectionIdentity(prisma, user);
    const visited = new Set();
    const pending = [actionId];
    const workflows = new Set();
    while (pending.length) {
        const current = pending.pop();
        if (!current || visited.has(current)) continue;
        visited.add(current);
        const action = await workflowsFetch("GET", `actions/${encodeURIComponent(current)}`);
        for (const workflow of action.rootActionOf || []) workflows.add(workflow.id);
        if (action.actionType === "workflow") {
            const definition = await workflowsFetch("GET", `workflows/action/${encodeURIComponent(current)}`);
            if (definition.id) workflows.add(definition.id);
        }
        pending.push(action.parentActionId, action.previousAction?.id);
    }
    if (workflows.size) {
        for (const workflowId of workflows) await authorizeWorkflow(prisma, user, workflowId);
        return;
    }
    for (const current of visited) {
        const permissions = await workflowsFetch("GET", `permissions?actionId=${encodeURIComponent(current)}&userId=${encodeURIComponent(professorId || "")}`);
        if (professorId && permissions.some(permission => permission.permissionType === "creator" && permission.userId === professorId)) return;
    }
    throw accessError("Action is not owned by this instructor");
}
