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