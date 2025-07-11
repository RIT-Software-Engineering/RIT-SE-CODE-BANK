const { exportAction } = require("./actions");

const exportWorkflow = (workflow) => ({
    ...workflow,
    base_action: exportAction(workflow.base_action),
    tags: workflow.tags.map((t) => t.name),
});

module.exports = { exportWorkflow };
