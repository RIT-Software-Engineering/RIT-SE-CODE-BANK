const { exportAction } = require("./actions");

const exportWorkflow = (workflow) => ({
    ...workflow,
    base_action: exportAction(workflow.base_action),
});

module.exports = { exportWorkflow };
