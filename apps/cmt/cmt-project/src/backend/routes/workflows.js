import express from "express";
import { workflowsFetch } from "../utils/workflows/api.js";

const router = express.Router();
export default router

router.put("/editCheckmarkAction", async (req, res) => {
    try {
        const { uid: userId, asid: actionStateId } = req.query
        const { stateType } = req.body
        const workflowsResponse = await workflowsFetch('POST', `/states/handleSubmit`, { actionStateId, stateType })
        return res.status(200).json()
    } catch(e) {
        return res.status(500).json({ error: e })
    }
})