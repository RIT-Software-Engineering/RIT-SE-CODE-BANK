/**
 * The Workflows API calls .toString on every value of the metadata object passed in.
 * This function converts an arbitrary metadata object into an object where each value is a JSON object, so that .toString doesnt wreck it.
 * @param {Object} metadata 
 * @return Metadata object ready to be sent to the Workflows API
 */
export function makeMetadataSafeForWorkflows(metadata) {
    let safeMetadata = {}
    Object.entries(metadata).forEach(([key, value]) => {
    safeMetadata[key] = JSON.stringify(value)
    })
    return safeMetadata
}