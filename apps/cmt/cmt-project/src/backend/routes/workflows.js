import express from "express";
import { createAction, makeMetadataSafeForWorkflows, newBuilderWorkflow, objectToNewAction, updateAction, workflowsFetch } from "../utils/workflows/api.js";
import { compressedMetadataToObject } from '@se-code-bank/workflows-ecosystem'
import { CMTActionToActionWithContexts } from "../utils/workflows/context.js";

const router = express.Router();
export default router

router.put("/editCheckmarkAction", async (req, res) => {
    try {
        const { uid: userId, asid: actionStateId } = req.query
        const { checked } = req.body
        const workflowsResponse = await workflowsFetch('POST', `/states/handleSubmit`, { actionStateId, stateType: checked ? "completed" : "notStarted" })
        return res.status(200).json()
    } catch(e) {
        return res.status(500).json({ error: e })
    }
})

router.get("/workflowTemplate", async(_, res) => {
    try {
        const workflows = await workflowsFetch("GET", "workflows/?tags=WorkflonyFirstTheRestNowhere_CMT_Template");
        workflows.forEach(workflow => {
            workflow.baseAction.metadata = compressedMetadataToObject(workflow.baseAction.metadata);
        });
        return res.status(200).json({workflows: workflows})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

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
        let safeMetadata;
        if (metadata)
            safeMetadata = makeMetadataSafeForWorkflows(metadata);
        const updatedWorkflow = await workflowsFetch("PUT", `workflows/${workflowId}`, {name:name, description:description, tags: tags, metadata: safeMetadata});
        return res.status(200).json({workflow: updatedWorkflow});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
});

router.delete("/workflowTemplate/:workflowId", async(req, res) => {
    try {
        const {workflowId} = req.params;
        const msg = workflowsFetch("DELETE", `workflows/${workflowId}`);
        return res.status(200).json({message: msg})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
});

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

router.put("/actionTemplate/action/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const {name, description, metadata} = req.body;
        const safeMetadata = metadata ? makeMetadataSafeForWorkflows(metadata) : makeMetadataSafeForWorkflows({});
        const action = workflowsFetch("PUT", `/actions/${actionId}`, {name:name, description: description, metadata: safeMetadata});
        return res.status(200).json({action: action})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
});

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

router.delete("/actionTemplate/action/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const msg = workflowsFetch("DELETE", `/actions/${actionId}`);
        return res.status(200).json({message: msg});
    } catch (error){
        return res.status(500).json({error: error.message});
    }
});

router.delete("/actionTemplate/workflow/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        const msg = workflowsFetch("DELETE", `/actions/${workflowId}`);
        return res.status(200).json({message: msg});
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

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

router.get("/actionTemplate/workflow/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        console.log("=".repeat(10))
        const actions = await workflowsFetch("GET", `/actions?workflowId=${workflowId}`);
        const actionWithContexts = actions.map(action => 
            CMTActionToActionWithContexts(action, null, null, req.user?.uid)
        );
        return res.status(200).json({actions: actionWithContexts, awc: actionWithContexts})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})