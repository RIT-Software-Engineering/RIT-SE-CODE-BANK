import express from "express";
import { compressedMetadataToObject } from '@se-code-bank/workflows-ecosystem'
import { CMTActionToActionWithContexts } from "../utils/workflows/context.js";
import { createAction, makeMetadataSafeForWorkflows, newBuilderWorkflow, objectToNewAction, updateAction, workflowsFetch } from "../utils/workflows/api.js";
import { PrismaClient } from '../prisma/generated/client/index.js'

const prisma = new PrismaClient();
const router = express.Router();
export default router

function findActionsWithContextsByCode(actionsWithContexts, code) {
    const matchingActions = [];

    for (const actionWithContexts of actionsWithContexts || []) {
        if (actionWithContexts.processedAction?.parsedMetadata?.code === code)
            matchingActions.push(actionWithContexts);

        matchingActions.push(
            ...findActionsWithContextsByCode(
                actionWithContexts.processedAction?.childActionsWithContexts,
                code
            )
        );
    }

    return matchingActions;
}

// workflow/editCheckmarkAction
router.put("/editCheckmarkAction", async (req, res) => {
    try {
        const { uid: userId, asid: actionStateId } = req.query
        const { checked } = req.body
        const workflowsResponse = await workflowsFetch('POST', `/states/handleSubmit`, { actionStateId, stateType: checked ? "completed" : "notStarted" })
        return res.status(200).json()
    } catch(e) {
        return res.status(500).json({ error: e })
    }
});

// workflow/publishCourseTemplate
// Not to be confused with meta-templates, these are course-specific templates
router.put("/publishCourseTemplate", async (req, res) => {
    try {
        const { asid: actionStateId, courseId} = req.query;
        await workflowsFetch("POST", `/states/handleSubmit`, { actionStateId, stateType: "completed" });

        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) },
            include: {professors: true}
        })
        const workflow = await workflowsFetch("GET", `/workflows/${course.workflowId}`);
        const tags = Array.from(workflow.tags.filter(item => !Date.parse(item)));
        const profName = `${course.professors.fname} ${course.professors.lname}`;
        // TODO modify this so we don't have a TOCTOU vuln.
        const date = new Date(); // set up here so we don't have a mismatch later
        [course.name, course.classId, course.season, profName, date, "TangledUpInLiesImAWorkflony"].forEach((elem) => {
            if (!workflow.tags.includes(elem))
                tags.push(elem);
        });
        const metadata = JSON.parse(JSON.stringify(workflow.baseAction.metadata)); // Make a clone of the metadata so we don't modify it directly
        metadata['CMTemplate'] = [course.name, course.classId, course.season, profName, date, "TangledUpInLiesImAWorkflony"];
        metadata['code'] = `CMTemplate_${courseId}`;

        const action = await workflowsFetch("GET", `/states/action/${actionStateId}`);

        await workflowsFetch("PUT", `/actions/${action.action.id}`, {isFrozen: true}); // Make it so the user can't unpublish a site
        await workflowsFetch("PUT", `/workflows/${workflow.id}`, {tags, metadata: makeMetadataSafeForWorkflows(metadata)}); // Update tags so it's searchable

        return res.status(200).json();
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

// workflow/workflowTemplate
router.get("/workflowTemplate", async(req, res) => {
    try {
        const {tags} = req.query;
        const workflows = await workflowsFetch("GET", `workflows/?tags=${tags}`);
        workflows.forEach(workflow => {
            workflow.baseAction.metadata = compressedMetadataToObject(workflow.baseAction.metadata);
        });
        return res.status(200).json({workflows: workflows})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

// workflow/workflowTemplate
router.post("/workflowTemplate", async(req, res) => {
    try {
        const {workflow} = req.body; 
        const professorId = req.user.uid;
        const workflows = await workflowsFetch("GET", "workflows/?tags=WorkflonyFirstTheRestNowhere_CMT_Template");
        workflows.forEach(prevWorkflows => {
            const prevMetaCode = JSON.parse(prevWorkflows.baseAction.metadata?.code)
            if (prevMetaCode !== "None" && prevMetaCode === workflow.metadata?.code)
                throw new Error("A workflow with this meta-workflow already exists! Please remove the meta-workflow from that workflow and try again.")
        });
        const newWorkflow = await newBuilderWorkflow(workflow, professorId);
        return res.status(200).json({workflow: newWorkflow});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

// workflow/workflowTemplate/:workflowId
router.put("/workflowTemplate/:workflowId", async(req, res) => {
    try {
        const {name, description, tags, metadata} = req.body; 
        const {workflowId} = req.params;
        const workflows = await workflowsFetch("GET", "workflows/?tags=WorkflonyFirstTheRestNowhere_CMT_Template");
        workflows.forEach(prevWorkflows => {
            const prevMetaCode = JSON.parse(prevWorkflows.baseAction.metadata?.code)
            if (prevMetaCode !== "None" && prevMetaCode === metadata?.code && workflowId !== prevWorkflows.id)
                throw new Error("A workflow with this meta-workflow already exists! Please remove the meta-workflow from that workflow and try again.")
        });
        let safeMetadata = metadata ? makeMetadataSafeForWorkflows(metadata): null;
        if (safeMetadata && Object.keys(safeMetadata).length === 0)
            safeMetadata = null;
        const updatedWorkflow = await workflowsFetch("PUT", `workflows/${workflowId}`, {name:name, description:description, tags: tags, metadata: safeMetadata});
        return res.status(200).json({workflow: updatedWorkflow});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
});

// workflow/workflowTemplate/:workflowId
router.delete("/workflowTemplate/:workflowId", async(req, res) => {
    try {
        const {workflowId} = req.params;
        const msg = workflowsFetch("DELETE", `workflows/${workflowId}`);
        return res.status(200).json({message: msg})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
});

// workflow/actionTemplate/action
router.post("/actionTemplate/action", async (req, res) => {
    try {
        const professorId = req.user.uid;
        const {name, description, actionType, metadata, parentActionId} = req.body;
        const newAction = await createAction(professorId, name, description, actionType, metadata, parentActionId);
        return res.status(200).json({action: newAction});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

// workflow/actionTemplate/workflow
router.post("/actionTemplate/workflow", async (req, res) => {
    try {
        const {workflow, parentActionId} = req.body; 
        const professorId = req.user.uid;
        const newWorkflow = await objectToNewAction(workflow, professorId, parentActionId);
        return res.status(200).json({action: newWorkflow});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

// workflow/actionTemplate/action/:actionId
router.put("/actionTemplate/action/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const {name, description, metadata} = req.body;
        let safeMetadata = metadata ? makeMetadataSafeForWorkflows(metadata) : {} ;
        if (safeMetadata && Object.keys(safeMetadata).length === 0)
            safeMetadata = null;
        const action = workflowsFetch("PUT", `/actions/${actionId}`, {name:name, description: description, metadata: safeMetadata});
        return res.status(200).json({action: action})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
});

// workflow/actionTemplate/workflow/:workflowId
router.put("/actionTemplate/workflow/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        const {name, description} = req.body;
        const workflow = workflowsFetch("PUT", `/actions/${workflowId}`, {name:name, description: description});
        return res.status(200).json({action: workflow});
    } catch (error) { 
        return res.status(500).json({error: error.message});
    }
});

// workflow/actionTemplate/action/:actionId
router.delete("/actionTemplate/action/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const msg = workflowsFetch("DELETE", `/actions/${actionId}`);
        return res.status(200).json({message: msg});
    } catch (error){
        return res.status(500).json({error: error.message});
    }
});

// workflow/actionTemplate/workflow/:workflowId
router.delete("/actionTemplate/workflow/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        const msg = workflowsFetch("DELETE", `/actions/${workflowId}`);
        return res.status(200).json({message: msg});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

// workflow/actionTemplate/nextAction/:actionId
router.put("/actionTemplate/nextAction/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const {name, description, nextActionId} = req.body;
        const action = await updateAction(name, description, nextActionId, actionId);
        return res.status(200).json({action: action})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

// workflow/actionTemplate/workflow/:workflowId
router.get("/actionTemplate/workflow/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        const actions = await workflowsFetch("GET", `/actions?workflowId=${workflowId}`);
        const actionsWithContexts = actions.map(action => 
            CMTActionToActionWithContexts(action, null, null, req.user?.uid)
        );

        const usedCodes = ["COURSE_SECTION", "NUMBER_STUDENTS", "COURSE_SEMESTER"].filter(
            code => findActionsWithContextsByCode(actionsWithContexts, code).length > 0
        );

        return res.status(200).json({actions: actionsWithContexts, codes: usedCodes})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})
