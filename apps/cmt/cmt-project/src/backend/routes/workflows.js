import express from "express";
import { createAction, objectToNewWorkflow, updateAction, workflowsFetch, workflowToObject } from "../utils/workflows/api.js";
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

router.post("/actionTemplate/", async (req, res) => {
    try {
        const professorId = req.user.uid;
        const {name, description, actionType, metadata, parentActionId} = req.body;
        const newAction = await createAction(professorId, name, description, actionType, metadata, parentActionId);
        return res.status(200).json({action: newAction});
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
})

router.put("/actionTemplate/:actionId", async (req, res) => {
    try {
        const {actionId} = req.params;
        const {name, description, nextActionId} = req.body;
        const action = await updateAction(name, description, nextActionId, actionId);
        return res.status(200).json({action: action})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})

router.get("/actionTemplate/:workflowId", async (req, res) => {
    try {
        const {workflowId} = req.params;
        console.log("=".repeat(50))
        const actions = await workflowsFetch("GET", `/actions?workflowId=${workflowId}`);
        actions.forEach(action => {
            if (action.metadata?.outputs){
                action.metadata.outputs = JSON.parse(action.metadata.outputs);
            console.log(action)
            return action
        }
        })
        return res.status(200).json({actions: actions})
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
})