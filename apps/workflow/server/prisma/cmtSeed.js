const { PrismaClient } = require("@prisma/client");
const { importMetadata } = require("../api/helpers/metadata");
const { permissionTypes } = require("../api/consts");
const prisma = new PrismaClient();

/**
 * Delete all the data in the workflows database
 */

async function deleteWorkflows() {
    await prisma.action.deleteMany({});
    await prisma.actionState.deleteMany({});
    await prisma.workflowState.deleteMany({});
    await prisma.metadata.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.workflowStateParticipant.deleteMany({});
    await prisma.workflowAttributes.deleteMany({});
}

/**
 * Create a workflow with the workflowData provided.
 *
 * @param {Object} workflowData
 * @returns An Object representing the workflow created
 */

async function createWorkflow(workflowData) {
  const baseActionData = {};

  // required
  baseActionData.name = workflowData.name;

  // optional
  if (workflowData.description)
    baseActionData.description = workflowData.description;
  if (workflowData.isFrozen) data.isFrozen = workflowData.isFrozen;
  if (workflowData.metadata) {
    let safeMetadata = {}
    Object.entries(workflowData.metadata).forEach(([key, value]) => {
      safeMetadata[key] = JSON.stringify(value)
    })
    baseActionData.metadata = {
      create: importMetadata(safeMetadata),
    };
  }         
  if (workflowData.previousActionId) {
    baseActionData.previousAction = {
      connect: { id: workflowData.previousActionId },
    };
  }
  if (workflowData.parentActionId) {
    baseActionData.parentAction = {
      connect: { id: workflowData.parentActionId },
    };
  }
  let tags;
  if (workflowData.tags) {
    tags = {
      // Add/re-add them
      connectOrCreate: workflowData.tags.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  let workflow;

  await prisma.$transaction(async () => {
    // Create the workflow
    workflow = await prisma.workflowAttributes.create({
      data: {
        baseAction: {
          create: {
            ...baseActionData,
            actionType: "workflow",
            permissions: {
              createMany: {
                data: permissionTypes.map((permissionType) => ({
                  userId: workflowData.userId,
                  permissionType: permissionType,
                })),
              },
            },
          },
        },
        tags: tags
      },
    });

    // Create any actions in this workflow
    if (workflowData.actions?.length > 0) {
      let lastActionId = null;

      for (let i = 0; i < workflowData.actions.length; i++) {
        const actionData = workflowData.actions[i];

        lastActionId
          ? (actionData.previousActionId = lastActionId)
          : (actionData.rootActionOfId = workflow.id);

        const action = await createAction(actionData);
        lastActionId = action.id;
      }
    }
  });

  return workflow;
}

/**
 * Create an action with the actionData provided.
 *
 * @param {Object} actionData
 * @returns An Object representing the action created
 */
async function createAction(actionData) {
    // For workflow base actions
      if (actionData.actionType && actionData.actionType === "workflow") {
        // Create a workflow and return the base action as the newly create action
        const workflow = await createWorkflow(actionData);
        // throw Error(actionData.previousActionId);
        return await prisma.action.findUnique({
          where: { id: workflow.baseActionId },
        });
      }
    
      // Get the data used to create the action
      const data = {};
    
      // required data
      data.name = actionData.name;
    
      // optional data
      if (actionData.description) data.description = actionData.description;
      if (actionData.form) data.form = actionData.form;
      if (actionData.actionType) data.actionType = actionData.actionType;
      if (actionData.isFrozen) data.isFrozen = actionData.isFrozen;
      if (actionData.metadata) {
        let safeMetadata = {}
        Object.entries(actionData.metadata).forEach(([key, value]) => {
          safeMetadata[key] = JSON.stringify(value)
        })
        data.metadata = {
          create: importMetadata(safeMetadata),
        };
      }
      // actions directly in complex/branching actions only
      if (actionData.parentActionId) {
        data.parentAction = { connect: { id: actionData.parentActionId } };
      }
      // actions directly in workflows only
      if (actionData.previousActionId) {
        data.previousAction = { connect: { id: actionData.previousActionId } };
      }
      if (actionData.rootActionOfId) {
        data.rootActionOf = { connect: { id: actionData.rootActionOfId } };
      }
    
      let action;
    
      await prisma.$transaction(async () => {
        // Create the data on the database using prisma
        action = await prisma.action.create({
          data: data,
        });
    
        // Create any child actions for this action
        if (actionData.childActions?.length > 0) {
          for (let i = 0; i < actionData.childActions.length; i++) {
            const childAction = actionData.childActions[i];
            childAction.parentActionId = action.id;
    
            await createAction(childAction);
          }
        }
      });
    
    return action;
}


/**
 * Main function
 */
async function main() {
  await deleteWorkflows();

  if (process.env.NODE_ENV === "production") {
    throw Error(
      "This action should only be used in development for populating the database with test data."
    );
  }

  ///////////
  // Users //
  ///////////

  const users = Array.from({ length: 10 }, (_, i) => ({
    id: `user${(i + 1).toString()}`,
  }));

  ///////////////
  // Workflows //
  ///////////////

    const oldWorkflowData = [
    {
      name: "SEED Create course",
      description:
        "A workflow that points to a complex action.",
      actionType: "workflow",
      userId: users[0].id,
      actions: [
        {
          name: "SEED Complex",
          description: "This is the first action in this workflow.",
          actionType: "complex",
          userId: users[0].id,
          childActions: [
            {
              name: "SEED Course Initialization",
              description: "This is the first action in this complex action.",
              actionType: "workflow",
              userId: users[0].id,
              actions: [
                {
                  name: "SEED Choose Template",
                  description: "The user needs to choose a template (or start from scratch)",
                  actionType: "simple",
                  metadata: {
                    key: "TEM", 
                  }
                },
                {
                  name: "SEED Fill in Details",
                  description: "The user enters the details for the course",
                  actionType: "simple",
                  metadata: {
                    key: "DET"
                  }
                }
              ]
            },
            {
              name: "SEED Upload Syllabus",
              description: "This is where the user uploads the syllabus.",
              metadata: {
                key: "SYL"
              }
            },
          ],
          metadata: {
            key: "value",
          },
        }
      ],
    },
  ];

  const workflowData = [
    {
    name: 'Create Course',
    description: 'Default course creation template',
    tags: ["WorkflonyFirstTheRestNowhere_CMT_Template"],
    userId: users[0].id,
    metadata: {code: "Course Creation Workflow"},
    actions: [
        {
            name: 'Course Details',
            description: 'Enter your course details',
            actionType: 'complex',
            childActions: [
                {
                    name: 'Course Section',
                    description: 'Enter your courses section',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_SECTION',
                        outputs: [
                            {
                                name: 'Course Section',
                                key: 'section',
                                type: 'text',
                                isRequired: true,
                                placeholder: '1',
                                validation: {
                                    maxLength: 30,
                                },
                            },
                        ],
                    },
                },
                {
                    name: 'Number of Students',
                    description: 'Enter the number of students enrolled in your course',
                    actionType: 'simple',
                    metadata: {
                        code: 'NUMBER_STUDENTS',
                        outputs: [
                            {
                                name: 'Number of Students',
                                key: 'students',
                                type: 'number',
                                isRequired: true,
                                placeholder: 20,
                                validation: {
                                    max: 999,
                                    min: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    name: 'Section Semester',
                    description: 'Enter the semester the section will take place in',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_SEMESTER',
                        outputs: [
                            {
                                name: 'Year',
                                key: 'year',
                                type: 'select',
                                isRequired: true,
                                validation: {
                                    options: [0,1,2,3].map(i => {return new Date().getFullYear()+i}),
                                },
                            },
                            {
                                name: 'Season',
                                key: 'season',
                                type: 'select',
                                isRequired: true,
                                validation: {
                                    options: ['Fall', 'Spring', 'Summer 1', 'Summer 2', 'Summer 3'],
                                },
                            },
                        ],
                    },
                },
            ],
        },
        {
            name: 'Create Sessions',
            description: 'Create sessions for your course',
            actionType: 'workflow',
            userId: users[0].id,
            actions: Array.from({ length: 28 }, (_, index) => {
                return {
                    name: `Create session ${index+1}`,
                    description:
                        'Create a session. In the workflow editor, more specific details could be given for certain sessions, like if a session should have an exam.',
                    actionType: 'simple',
                    metadata: {
                        code: `SESSION_${index}`,
                        outputs: [{
                          isRequired: true,
                          validation: {
                            sessionNum: index+1
                          },
                        }]
                    },
                }
            }),
        },
        {
            name: 'Publish Course Website',
            description: 'Navigate to the course generation page and publish your website!',
            actionType: 'workflow',
            userId: users[0].id,
            actions: [
                {
                    name: 'Set Column Visibilities',
                    description: 'Hide columns that contain internal information',
                    actionType: 'simple',
                    metadata: {
                        code: 'CHECKMARK',
                    },
                },
                {
                    name: 'Publish Course Website',
                    description: "You're all ready to publish!",
                    actionType: 'simple',
                    metadata: {
                        code: 'CHECKMARK',
                    },
                }
            ],
        },
    ]
  }];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      await createWorkflow(w);
    })
  );

  console.log("🌱 Seed data created successfully!");
}

/**
 * Call main function
 */
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


