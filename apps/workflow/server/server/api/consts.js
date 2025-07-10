// supported metadata types 
const metadataTypes = [
    'string',
    'number',
    'boolean',
];

const actionTypes = [
    'simple',
    'workflow',
    'complex',
    'branching'
];

const permissionTypes = [
    'creator',
    'sharer',
    'editor',
    'viewer'
];

module.exports = {
    metadataTypes,
    actionTypes,
    permissionTypes
};