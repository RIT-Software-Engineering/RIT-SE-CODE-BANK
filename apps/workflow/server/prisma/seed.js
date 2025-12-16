const { permissionTypes } = require("../api/consts");
const { importMetadata } = require("../api/helpers/metadata");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  if (typeof workflowData.requireAllParticipants === "boolean") {
    baseActionData.requireAllParticipants = workflowData.requireAllParticipants;
  }
  if (workflowData.metadata) {
    baseActionData.metadata = {
      create: importMetadata(workflowData.metadata),
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
  if (typeof actionData.requireAllParticipants === "boolean") {
    data.requireAllParticipants = actionData.requireAllParticipants;
  }
  if (actionData.metadata) {
    data.metadata = {
      create: importMetadata(actionData.metadata),
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

    //make an action state for this actiony
    await prisma.actionState.create({
    data: {
      stateType: 'notStarted',
      actionId: action.id,
      index: 0
    },
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

async function main() {

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

  const workflowData = [
    {
      name: "Onboarding Workflow",
      description: "The set of actions Scooployees go through during onboarding",
      userId: users[2].id,
      actions: [
        {
          name: "Drop Classes",
          description: "Drop all classes you are currently enrolled in",
          metadata: {
            key: "value",
          },
        },
        {
          name: "Report Co-op",
          description: "Report Scoop as a Co-op in career connect",
          metadata: {
            key1: "value1",
            key2: "value2",
            number: 1,
          },
        },
        {
          name: "Warmup",
          description: "Complete the Scoop warmup",
        },
        {
          name: "Join Slack",
          description: "Join the Scoop slack channels",
        },
        {
          name: "Complete Scoop Promise",
          description: "Scooployees complete their Scoop promise and send it to the Scoodinator",
        },
        {
          name: "Team Skills Grid",
          description: "Team will navigate the repository and find any necessary skills and rate their expertise and knowledge from 0-5",
        },
        {
          name: "Make Individual Domain Models",
          description: "After being briefed on the basics of their project each Scooployee will complete an individual domain model to level set their Mental Model.",
        },
        {
          name: "Midterm Presentation",
          description: "Each SCOOP team will give a presentation near the halfway point of the term to reflect on and share their progress",
        },
        {
          name: "Accept SCOOP Offer",
          description: "Students confirm their acceptance of the SCOOP placement via Slack.",
        },
        {
          name: "Team contract",
          description: "Teams draft a contract outlining norms, communication expectations, and responsibilities.",
        },
        {
          name: "Make Team domain model",
          description: "After all team members complete their individual domain models they will meet as a group to consolidate their work into one final team domain model.",        
        },
        {
          name: "Join dev team",
          description: "Each Scooployee will accept the Github invite once they recieve it from the Scoopdinator.",
        },
        {
          name: "Confirm are able to write to repo by doing creating bogus branch and submitting URL",
          description: "After being granted access to the repo, one Scooployee will attempt to create a branch to ensure they have write access, then submit the URL of the branch to the SCOOPervisor",
        },
        {
          name: "Get the project running locally",
          description: "Each Scooployee will clone the latest version of their projects dev branch and attempt to get the project running locally.",
        },
        {
          name: "Create User Stories",
          description: "Each SCOOP team will create the user stories that they plan to work on for the term.",
        },
      ],
    }, 
  ];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      await createWorkflow(w);
    })
  );


  console.log("🌱 Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
