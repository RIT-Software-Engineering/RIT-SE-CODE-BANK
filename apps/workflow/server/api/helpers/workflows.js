const { exportAction } = require("./actions");

const exportWorkflow = (workflow) => ({
    ...workflow,
    baseAction: exportAction(workflow.baseAction),
    tags: workflow.tags?.map((t) => t.name),
});

module.exports = { exportWorkflow };
