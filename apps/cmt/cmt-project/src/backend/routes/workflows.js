import express from "express";
import { combineActionWorkflow, createAction, getWorkflowActions, objectToNewAction, objectToNewWorkflow, updateAction, workflowsFetch, workflowToObject } from "../utils/workflows/api.js";
import { actionToActionWithContext } from "../utils/workflows/actionPipeline.js";
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
        const workflows = await workflowsFetch("GET", "workflows/?tags=CMT_Template");
        return res.status(200).json({workflows: workflows})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

router.post("/workflowTemplate", async(req, res) => {
    try {
        const {workflow} = req.body; 
        const professorId = req.user.uid;
        const newWorkflow = await objectToNewWorkflow(workflow, professorId);
        return res.status(200).json({workflow: newWorkflow});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

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
        console.log("=".repeat(50))
        const actions = await workflowsFetch("GET", `/actions?workflowId=${workflowId}`);
        // console.log("all actions: ", actions)
        // const returnedActions = await Promise.all(actions.map(async action => {
        //     if (action.actionType === "workflow"){
        //         action = await getWorkflowActions(action.id)
        //         console.log("Returned stuff: ", action)
        //     }
           
        //     else if (action.metadata?.outputs){
        //         action.metadata.outputs = JSON.parse(action.metadata.outputs)
        //     }
        //     console.log("With context: ", actionToActionWithContext(action, null, null, req.user?.uid))
        //     return action
        // }))
        // console.log(returnedActions)
        const actionWithContexts = actions.map(action => 
            actionToActionWithContext(action, null, null, req.user?.uid)
        )
        return res.status(200).json({actions: actionWithContexts, awc: actionWithContexts})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})