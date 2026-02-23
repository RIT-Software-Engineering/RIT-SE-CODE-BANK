 /**
 * Workflows will take the object you give to it as the metadata and turn it into an array of key value pairs.
 * This makes it very hard to access by key, so this function will take that array and turn it back into an object.
 * It is meant for usage with `makeMetadataSafeForWorkflows` when uploading metadata 
 * 
 * @param {Array} metadataArray array of metadata given by the workflows API (and our endpoints)
 */
export function metadataArrayToObject(metadataArray) {
    let metadata = {}
    Object.keys(metadataArray).forEach(key => {
        metadata[key] = JSON.parse(metadataArray[key])
    })
    return metadata
}

/**
 * The various output renderers need to manage their state, so this complex snippet has been shared across them.
 * This code is in a function and not centralized in one component because otherwise it is difficult to control styling across output renderers
 * 
 * @param {object} metadata Metadata returned from {@link metadataArrayToObject} 
 * @returns object that has all of the keys defined by output with their corresponding initial values
 */
export function metadataObjectToState(metadata) {
    return Object.fromEntries(metadata.outputs.map(output => [output.key, output.initialValue]))
}