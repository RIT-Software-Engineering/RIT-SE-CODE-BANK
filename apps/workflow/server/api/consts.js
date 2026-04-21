const actionTypes = ["simple", "workflow", "complex", "branching"];

const permissionTypes = ["creator", "sharer", "editor", "viewer"];

const submissionAllowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

module.exports = {
    actionTypes,
    permissionTypes,
    submissionAllowedMimeTypes,
};
