import { useNavigate } from "react-router-dom"

/**
 * The various output renderers need to manage their state, so this complex snippet has been shared across them.
 * This code is in a function and not centralized in one component because otherwise it is difficult to control styling across output renderers
 * 
 * @param {object} metadata Metadata returned from {@link metadataArrayToObject} 
 * @param {object} data An object with keys matching those defined in the metadata. Used to display values after user submission
 * @returns object that has all of the keys defined by output with their corresponding initial values
 */
export function metadataObjectToState(metadata, data) {
    if (!metadata.outputs) return null
    return Object.fromEntries(metadata.outputs.map(
        output => [
            output.key, 
            (data && data[output.key]) ?? output.initialValue
        ]
    ))
}

/**
 * Transforms the nested representation of ActionsWithContext into a 
 * flat array of all of the ActionsWithContext contained in the given ActionsWithContext
 * 
 * Takes an array because the backend gives them in an array. The backend gives them in an array because the workflows API does too.
 * 
 * @param {array} actionsWithContext 
 * @returns Array containing all of the actionsWithContext that were nested inside of the given array.
 */
export function flattenActionsWithContext(actionsWithContext) {
    const flattenedActionsWithContext = []

    function traverse(awc) {
        flattenedActionsWithContext.push(awc)
        if (awc.action.childActionsWithContext)
            for (const childAwc of awc.action.childActionsWithContext)
                traverse(childAwc)
    }

    for (const awc of actionsWithContext)
        traverse(awc)

    console.log(flattenedActionsWithContext)
    return flattenedActionsWithContext
}

/**
 * CMT's onNavigateFactory, which will return navigation functions for certain codes.
 * 
 * @param {string} code 
 * @returns {() => void | null} onNavigate
 */
export function UseCMTOnNavigateFactory(code) {
    const navigate = useNavigate()
    let getEl;

    if (code.includes("SESSION_")) getEl = () => document.getElementById(`WORKFLOW_JUMPPOINT_${code}`) 
    if (code === "CHECKMARK_PUBLISH_SITE" || code === "CHECKMARK_COLUMN_VISIBILITIES") return () => navigate("/coursewebsite")

    if (getEl) return () => getEl()?.scrollIntoView({ behavior: "smooth" })

    return null
}