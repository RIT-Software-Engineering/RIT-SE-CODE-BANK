const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getFullActionTree } = require("../helpers/actions.js");

// I'm sorry for the chaos that this file is. I tried to leave enough inline comments that you could follow my madness. I'm very short on time.

// TODOs: 
// - Come up with a standard approach to calling all of these recursive methods
// - Figure out what needs to be awaited and what can remain asyncronous
// - Set this up to avoid too much recursion depth causing stack overflow errors (haven't run into one, but should have preventative measures)
// - Optimize
// - Improve readability and organization

const REQUIRE_ALL_METADATA_KEYS = [
  "requireallparticipants",
  "requiresallparticipants",
  "requireall",
  "requiresall",
  "requireeveryone",
  "requiringeveryone",
];

const truthyStrings = new Set(["true", "1", "yes", "y", "on"]);

function metadataEntries(metadata) {
  if (!metadata) return [];
  if (Array.isArray(metadata)) return metadata;
  return Object.entries(metadata).map(([key, value]) => ({
    key,
    value: value?.toString?.() ?? String(value),
  }));
}

function metadataValueIsTruthy(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return truthyStrings.has(value.toLowerCase());
  }
  return false;
}

function actionRequiresAllParticipants(action) {
  if (action?.requireAllParticipants === true) {
    return true;
  }
  const metadata = metadataEntries(action?.metadata);
  return metadata.some(
    (entry) =>
      REQUIRE_ALL_METADATA_KEYS.includes(entry.key?.toLowerCase?.()) &&
      metadataValueIsTruthy(entry.value)
  );
}

async function findRootActionStateId(actionStateId, initialParentId) {
  let currentId = actionStateId;
  let parentId = initialParentId;

  if (parentId === undefined) {
    const current = await prisma.actionState.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    parentId = current?.parentId ?? null;
  }

  while (parentId) {
    currentId = parentId;
    const current = await prisma.actionState.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!current) {
      return null;
    }
    parentId = current.parentId;
  }

  return currentId;
}

async function findWorkflowStateForActionState(actionStateId, initialParentId) {
  const rootActionStateId = await findRootActionStateId(
    actionStateId,
    initialParentId
  );
  if (!rootActionStateId) return null;

  return prisma.workflowState.findUnique({
    where: { baseActionStateId: rootActionStateId },
    include: {
      participants: true,
    },
  });
}

function collectParticipantIds(
  workflowState,
  fallbackUserId = null,
  submissionUserIds = []
) {
  const ids = new Set();
  if (workflowState?.userId) ids.add(workflowState.userId);
  workflowState?.participants?.forEach((participant) => {
    if (participant?.userId) {
      ids.add(participant.userId);
    }
  });
  submissionUserIds
    ?.filter((id) => typeof id === "string" && id.trim().length > 0)
    .forEach((id) => ids.add(id));
  if (fallbackUserId) ids.add(fallbackUserId);
  return ids;
}

function sanitizeUserIds(possibleIds) {
  if (!Array.isArray(possibleIds)) return [];

  const ids = new Set();
  possibleIds.forEach((value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      ids.add(trimmed);
    }
  });

  return Array.from(ids);
}

/**
 * Recurisve function for collecting all action states branching from a a specific action.
 *
 * @param {*} where
 * @param {*} include
 * @param {*} select
 * @returns
 */
async function getChildren(where, include = null, select = null) {
  // Get the children for the action whose ID matches parentActionId.
  const children = await prisma.actionState.findMany({
    where: where,
    include: include,
    select: select,
    orderBy: {
      index: "asc",
    },
  });

  // Recursively call this function for all of the children
  // and add all found children to their respective parent.
  for (let i = 0; i < children.length; i++) {
    const grandChildren = await getChildren(
      { ...where, parentId: children[i].id },
      include,
      select
    );
    if (grandChildren?.length > 0) {
      children[i].children = grandChildren;
    }
  }

  return children;
}

// GET /states/:id
router.get("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  // Get the workflowState
  const state = await prisma.workflowState.findUnique({
    where: { id: id },
    include: {
      baseActionState: true,
      participants: true,
    },
  });

  // Add any actionStates stemming from the baseActionState as it's children
  const children = await getChildren(
    { parentId: state.baseActionStateId },
    {
      action: { include: { metadata: true } },
      submissions: true,
    }
  );
  if (children?.length > 0) {
    state.baseActionState.children = children;
  }

  res.json(state);
});

// GET /states/workflow
router.get("/workflow", async (req, res) => {
  const { userId, workflowId } = req.query;

  const filters = [];
  if (workflowId) filters.push({ workflowId });
  if (userId) {
    filters.push({
      OR: [
        { userId },
        {
          participants: {
            some: {
              userId,
            },
          },
        },
      ],
    });
  }

  const states = await prisma.workflowState.findMany({
    where: filters.length > 0 ? { AND: filters } : {},
    include: {
      baseActionState: true,
      actionStates: {
        include: {
          action: { include: { metadata: true } },
          submissions: true,
        },
      },
      participants: true,
    },
  });

  res.json(states);
});

/**
 * Function for updating an actionState its children's stateTypes.
 *
 * @param {*} actionStateId
 * @returns The ActionState that was updated.
 */
async function updateStateByChildren(actionStateId) {
  // Get the current stateType, actionType, and all child actionState stateTypes.
  const actionState = await prisma.actionState.findUnique({
    where: { id: actionStateId },
    select: {
      parentId: true,
      stateType: true,
      children: {
        select: {
          stateType: true,
        },
      },
      action: {
        select: {
          actionType: true,
        },
      },
    },
  });

  // Updated stateType
  let newStateType = "notStarted";

  // State machine for determining the new stateType
  currentStateType: switch (actionState.action.actionType) {
    // For workflow and complex actionTypes
    case "workflow":
    case "complex":
      for (let i = 0; i < actionState.children.length; i++) {
        const child = actionState.children[i];

        // Update the newActionState based on what it currently is, and the stateTypes of it's children
        switch (child.stateType) {
          // newStateType will be completed if all visible children are completed,
          // or inProgress of any of the visible children aren't completed.
          case "completed":
            if (newStateType === "completed" || i === 0) {
              newStateType = "completed";
            } else if (newStateType === "notStarted") {
              newStateType = "inProgress";
              break currentStateType;
            }
            break;

          // newStateType will be inProgress
          case "inProgress":
            newStateType = "inProgress";
            break currentStateType;

          // newStateType will be notStarted if all children were notStarted.
          // Otherwise, newStateType will be inProgress.
          case "notStarted":
            if (newStateType === "completed") {
              newStateType = "inProgress";
              break currentStateType;
            }
            break;

          // Hidden actionStates don't effect parent actionState.
          case "hidden":
            break;

          // If the actionState isn't one of our defined ones.
          default:
            throw Error("Unexpected state type encountered");
        }
      }
      break;

    // For branching actions
    case "branching":
      for (let i = 0; i < actionState.children.length; i++) {
        const child = actionState.children[i];

        // Update the newActionState based on what it currently is, and the stateTypes of it's children
        switch (child.stateType) {
          // newStateType is completed if any child is completed.
          case "completed":
            newStateType = "completed";
            break currentStateType;

          // newStateType is unless there is another child that is completed.
          case "inProgress":
            newStateType = "inProgress";
            break;

          // newStateType is not affected by a child with these stateTypes.
          case "notStarted":
          case "hidden":
            break;

          // If the actionState isn't one of our defined ones.
          default:
            throw Error("Unexpected state type encountered");
        }
      }
      break;
  }

  // Update the state to what it needs to be
  if (actionState.stateType !== newStateType) {
    await prisma.actionState.update({
      where: { id: actionStateId },
      data: { stateType: newStateType },
    });
  }

  return actionState;
}

/**
 * Recursive function used to create state for all of the actions and sub actions in a list of actions.
 *
 * @param {Array<Object>} actions
 * @param {String} parentActionStateId
 * @param {() => void} [dataModifier=() => {}] A function reference for modifying the data object that is passed to the function.
 */
async function createActionStates(
  actions,
  parentActionStateId = null,
  dataModifier = () => {}
) {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    const data = {
      stateType: "notStarted",
      action: { connect: { id: action.id } },
      index: i,
    };
    if (parentActionStateId) {
      data.parent = { connect: { id: parentActionStateId } };
    }

    dataModifier(data);

    const actionState = await prisma.actionState.create({
      data: data,
    });

    if (action.childActions?.length > 0) {
      await createActionStates(
        action.childActions,
        actionState.id,
        dataModifier
      ); // Recursively create child actions of the current action
    }
  }
  await updateStateByChildren(parentActionStateId);
}

// POST /states/workflow
router.post("/workflow", async (req, res) => {
  const { userId, workflowId, teamId, participantUserIds } = req.body;

  const participantIds = new Set(sanitizeUserIds(participantUserIds));
  if (typeof userId === "string" && userId.trim().length > 0) {
    participantIds.add(userId);
  }

  const participants = Array.from(participantIds);
  const owningUserId =
    typeof userId === "string" && userId.trim().length > 0
      ? userId
      : participants.length === 1
      ? participants[0]
      : null;
  const teamIdentifier =
    typeof teamId === "string" && teamId.trim().length > 0 ? teamId : null;

  let stateId;

  await prisma.$transaction(async () => {
    // Ensure the workflow exists before creating a state
    const workflow = await prisma.workflowAttributes.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} does not exist.`);
    }

    if (!workflow.rootActionId) {
      throw new Error(`Workflow with ID ${workflowId} has no root action.`);
    }

    // Create the workflowState
    const createdState = await prisma.workflowState.create({
      data: {
        userId: owningUserId,
        teamId: teamIdentifier,
        workflow: { connect: { id: workflowId } },
        baseActionState: {
          create: {
            stateType: "notStarted",
            action: { connect: { id: workflow.baseActionId } },
            index: 0,
          },
        },
        participants:
          participants.length > 0
            ? {
                create: participants.map((id) => ({
                  userId: id,
                })),
              }
            : undefined,
      },
    });

    stateId = createdState.id;

    // Get all of the actions in the workflow and create ActionStates for them
    const actions = await getFullActionTree(workflow.rootActionId);
    await createActionStates(actions, createdState.baseActionStateId);
  });

  const state = await prisma.workflowState.findUnique({
    where: { id: stateId },
    include: {
      baseActionState: true,
      participants: true,
    },
  });

  res.json(state);
});

/**
 * Helper function used to reorganize a action in a tree into a flat list.
 *
 * @param {*} actions
 * @returns A list of actions
 */
function flattenActions(actions) {
  const actionSet = new Set();
  function recurse(actionList) {
    for (const action of actionList) {
      if (action.childActions && action.childActions.length > 0) {
        const childActions = action.childActions;
        const childActionIds = [];
        for (let i = 0; i < childActions.length; i++) {
          childActionIds.push(childActions[i].id);
        }
        action.childActions = childActionIds;
        actionSet.add(action);
        recurse(childActions);
      } else {
        actionSet.add(action);
      }
    }
  }
  recurse(actions);
  return [...actionSet];
}

/**
 * Helper function used to collect all action states in a tree stemming from one action state
 * and save them in a flat list.
 *
 * @param {*} where
 * @param {*} include
 * @param {*} select
 * @returns A list of actionStates
 */
async function flattenActionStates(where, include = null, select = null) {
  let actionStateList = [];
  // Get the children for the action whose ID matches parentActionId.
  const children = await prisma.actionState.findMany({
    where: where,
    include: include,
    select: select,
    orderBy: {
      index: "asc",
    },
  });

  actionStateList.push(...children);

  // Recursively call this function for all of the children
  // and add all found children to their respective parent.
  for (let i = 0; i < children.length; i++) {
    const grandChildren = await flattenActionStates(
      { ...where, parentId: children[i].id },
      include,
      select
    );
    if (grandChildren?.length > 0) {
      actionStateList.push(...grandChildren);
    }
  }

  return actionStateList;
}

/**
 * PUT /states/workflow/:id
 *
 * The primary function of this is updating the actionStates based on changes to actions within a workflow.
 */
router.put("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async () => {
    // Get the workflowState by id to get the workflow and actionStates
    const workflowState = await prisma.workflowState.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        baseActionState: true,
      },
    });

    if (!workflowState) {
      throw new Error("Workflow state not found");
    }

    // Get all of the actions from the workflow, in order.
    const actions = await getFullActionTree(
      workflowState.workflow.rootActionId
    );

    // Flatten the list of all actions in the workflow.
    const actionList = flattenActions(structuredClone(actions));

    // Collect a list of all actionSates in the workflowState with all data
    // Flatten the list of all actionStates in the workflowState
    const actionStateList = await flattenActionStates({
      parentId: workflowState.baseActionStateId,
    });

    // Filter out the actionStates that no longer have an associated action
    const actionIds = new Set(actionList.map((a) => a.id));
    const filteredActionStateList = actionStateList.filter((as) =>
      actionIds.has(as.actionId)
    );

    // Map the action ids to the existing action states
    const actionIdToStateMap = new Map(
      filteredActionStateList.map((as) => [as.actionId, as])
    );

    // Delete all of the actionStates in that WorkflowState
    await prisma.actionState.deleteMany({
      where: { parentId: workflowState.baseActionStateId },
    });

    // Build the workflowState back out using specific data (id, stateType) from the map of actions to action states when available
    await createActionStates(
      actions,
      workflowState.baseActionStateId,
      (data) => {
        const map = actionIdToStateMap;

        const actionState = map.get(data.action.connect.id);
        if (actionState) {
          data.id = actionState.id;
          data.stateType = actionState.stateType;
        }
      }
    );

    // Return the updated workflowState
    const updated = await prisma.workflowState.findUnique({
      where: { id: id },
      include: {
        workflow: true,
        baseActionState: true,
        participants: true,
      },
    });

    // Add any actionStates stemming from the baseActionState as it's children
    const children = await getChildren(
      { parentId: updated.baseActionStateId },
      {
        action: { include: { metadata: true } },
        submissions: true,
      }
    );
    if (children?.length > 0) {
      updated.baseActionState.children = children;
    }

    res.json(updated);
  });
});

// DELETE /states/workflow/:id
router.delete("/workflow/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.$transaction(async () => {
    const workflowState = await prisma.workflowState.findUnique({
      where: { id: id },
    });

    await prisma.actionState.delete({
      where: { id: workflowState.baseActionStateId },
    });
  });

  res.json({ message: "Deleted" });
});

router.put("/workflow/:id/participants", async (req, res) => {
  const { id } = req.params;
  const participantIds = sanitizeUserIds(req.body?.participantUserIds);
  const parentIdsToCascade = new Set();

  if (participantIds.length === 0) {
    return res.status(400).json({
      message: "participantUserIds must include at least one user id.",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const workflowState = await tx.workflowState.findUnique({
        where: { id },
        include: {
          actionStates: {
            select: { id: true },
          },
        },
      });

      if (!workflowState) {
        throw new Error("Workflow state not found");
      }

      await tx.workflowStateParticipant.deleteMany({
        where: {
          workflowStateId: id,
          userId: { notIn: participantIds },
        },
      });

      const existing = await tx.workflowStateParticipant.findMany({
        where: { workflowStateId: id },
        select: { userId: true },
      });

      const existingSet = new Set(existing.map((p) => p.userId));
      const toCreate = participantIds.filter((pid) => !existingSet.has(pid));

      if (toCreate.length > 0) {
        await tx.workflowStateParticipant.createMany({
          data: toCreate.map((pid) => ({
            workflowStateId: id,
            userId: pid,
          })),
        });
      }

      const actionStateIds = workflowState.actionStates.map((as) => as.id);
      if (actionStateIds.length > 0) {
        const participantSet = new Set(participantIds);
        await tx.actionStateSubmission.deleteMany({
          where: {
            actionStateId: { in: actionStateIds },
            userId: { notIn: participantIds },
          },
        });

        for (const actionStateId of actionStateIds) {
          for (const userId of participantIds) {
            await tx.actionStateSubmission.upsert({
              where: {
                actionStateId_userId: {
                  actionStateId,
                  userId,
                },
              },
              update: {},
              create: {
                actionStateId,
                userId,
                completed: false,
              },
            });
          }
        }

        const actionStatesForRecalc = await tx.actionState.findMany({
          where: { id: { in: actionStateIds } },
          include: {
            action: { include: { metadata: true } },
            submissions: {
              select: {
                userId: true,
                completed: true,
              },
            },
          },
        });

        for (const actionState of actionStatesForRecalc) {
          if (actionState.stateType === "hidden") continue;

          const requiresAll = actionRequiresAllParticipants(actionState.action);
          if (!requiresAll) continue;

          const completedCount = actionState.submissions.filter(
            (submission) =>
              submission.completed && participantSet.has(submission.userId)
          ).length;
          const requiredCount =
            participantSet.size > 0 ? participantSet.size : 1;
          const fullyCompleted = completedCount >= requiredCount;
          const desiredStateType = fullyCompleted
            ? "completed"
            : completedCount > 0
            ? "inProgress"
            : "notStarted";

          if (actionState.stateType !== desiredStateType) {
            await tx.actionState.update({
              where: { id: actionState.id },
              data: { stateType: desiredStateType },
            });
            if (actionState.parentId) {
              parentIdsToCascade.add(actionState.parentId);
            }
          }
        }
      }
    });

    for (const parentId of parentIdsToCascade) {
      await cascadeSubmission(parentId);
    }

    const participants = await prisma.workflowStateParticipant.findMany({
      where: { workflowStateId: id },
    });

    res.json({
      participants,
    });
  } catch (error) {
    console.error("Failed to update workflow participants:", error);
    res.status(500).json({ message: "Failed to update participants." });
  }
});

// May not need this
// GET /states/action/:id
router.get("/action/:id", async (req, res) => {
  const { id } = req.params;

  const state = await prisma.actionState.findUnique({
    where: { id: id },
    include: {
      action: true,
    },
  });

  res.json(state);
});

// What do I really want from this function?
// Should the child actionStates be nested, or should this just be a flat list?
// How do I manage the UserId search and the workflowStateId search
// May not even need this
// GET /states/action
router.get("/action", async (req, res) => {
  const { userId, workflowStateId, actionId, stateType } = req.query;

  const where = {};
  if (userId) where.userId = userId;
  if (actionId) where.actionId = actionId;
  if (stateType) where.stateType = stateType;

  let states;
  if (workflowStateId) {
    // states = await prisma.actionState.findUnique({
    //   where: { ...where, workflowStateId: workflowStateId },
    // });
  } else {
    states = await prisma.actionState.findMany({
      where: where,
      include: {
        action: true,
      },
      orderBy: {
        index: "asc",
      },
    });
  }

  res.json(states);
});

// This may not be necessary
// PUT /states/action/:id
router.put("/action/:id", async (req, res) => {
  const { id } = req.params;
  const { stateType } = req.body;

  const data = {};
  if (stateType) {
    data.stateType = stateType;
  }

  const actionState = await prisma.actionState.update({
    where: { id: id },
    data: data,
  });

  if (data.stateType && data.stateType !== "completed") {
    await prisma.actionStateSubmission.deleteMany({
      where: { actionStateId: id },
    });
  }

  res.json(actionState);
});

async function findFirstSimpleIncomplete(actionStateId) {
  const actionState = await prisma.actionState.findUnique({
    where: {
      id: actionStateId,
    },
    include: {
      action: true,
    },
  });

  if (
    actionState.stateType === "completed" ||
    actionState.stateType === "hidden"
  ) {
    return null;
  } else {
    if (actionState.action.actionType === "simple") {
      return actionState;
    } else {
      const firstIncompleteChild = await prisma.actionState.findFirst({
        select: { id: true },
        where: {
          parentId: actionStateId,
          stateType: { notIn: ["completed", "hidden"] },
        },
        orderBy: { index: "asc" },
      });
      if (!firstIncompleteChild) return null;
      return await findFirstSimpleIncomplete(firstIncompleteChild.id);
    }
  }
}

/**
 * An endpoint that takes you to the first step in the workflow that isn't completed or hidden.
 * If this is a complex action or a branching action, it stops at that level.
 */
router.get("/workflow/:workflowStateId/findStep", async (req, res) => {
  const { workflowStateId } = req.params;

  const workflowState = await prisma.workflowState.findUnique({
    where: { id: workflowStateId },
  });

  const step = await findFirstSimpleIncomplete(workflowState.baseActionStateId);

  res.json(step);
});

/**
 * Calls updateStateByChildren recursively for the ActionState associated
 * with the passed actionStateId, and all of the parenting ActionStates.
 *
 * @param {*} actionStateId
 */
async function cascadeSubmission(actionStateId) {
  await prisma.$transaction(async () => {
    const actionState = await updateStateByChildren(actionStateId);

    // Cascade status updates upward
    if (actionState.parentId) await cascadeSubmission(actionState.parentId);
  });
}

/**
 * Update the state of actions to track progress.
 */
router.post("/handleSubmit", async (req, res) => {
  const { actionStateId, userId, workflowStateId } = req.body;
  const requestedStateType = req.body.stateType ?? "completed";

  if (!actionStateId) {
    return res.status(400).json({ message: "actionStateId is required." });
  }

  const existingActionState = await prisma.actionState.findUnique({
    where: { id: actionStateId },
    include: {
      action: {
        include: { metadata: true },
      },
      parent: {
        select: { id: true },
      },
      submissions: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!existingActionState) {
    return res.status(404).json({ message: "Action state not found." });
  }

  if (existingActionState.action.actionType !== "simple") {
    return res.status(400).json({
      message: "This action will only be completed by completing sub actions.",
    });
  }

  let workflowState = null;
  if (workflowStateId) {
    workflowState = await prisma.workflowState.findUnique({
      where: { id: workflowStateId },
      include: {
        participants: true,
      },
    });
  } else {
    workflowState = await findWorkflowStateForActionState(
      actionStateId,
      existingActionState.parentId
    );
  }
  if (!workflowState) {
    return res
      .status(404)
      .json({ message: "Owning workflow state could not be located." });
  }

  const requiresAll = actionRequiresAllParticipants(existingActionState.action);
  const submissionUserIds =
    existingActionState.submissions?.map((submission) => submission.userId) ??
    [];
  const participantIds = collectParticipantIds(
    workflowState,
    userId,
    submissionUserIds
  );
  const requiredCount = requiresAll
    ? Math.max(participantIds.size, 1)
    : 1;

  if (requiresAll && !userId) {
    return res.status(400).json({
      message: "userId is required when submitting this action.",
    });
  }

  if (requiresAll && participantIds.size > 0 && !participantIds.has(userId)) {
    return res.status(403).json({
      message: "This user is not a participant in the workflow state.",
    });
  }

  let responsePayload = null;
  let cascadeParentId = null;

  await prisma.$transaction(async (tx) => {
    const submissionTimestamp = new Date();
    if (requiresAll) {
      await tx.actionStateSubmission.upsert({
        where: {
          actionStateId_userId: {
            actionStateId,
            userId,
          },
        },
        update: {
          completed: true,
          completedAt: submissionTimestamp,
        },
        create: {
          actionStateId,
          userId,
          completed: true,
          completedAt: submissionTimestamp,
        },
      });

      const participantFilter =
        participantIds.size > 0
          ? Array.from(participantIds)
          : [userId].filter(Boolean);

      const completedCount = await tx.actionStateSubmission.count({
        where: {
          actionStateId,
          completed: true,
          ...(participantFilter.length > 0
            ? { userId: { in: participantFilter } }
            : {}),
        },
      });

      const fullyCompleted = completedCount >= requiredCount;
      const nextStateType = fullyCompleted ? requestedStateType : "inProgress";

      const updatedState = await tx.actionState.update({
        where: { id: actionStateId },
        data: {
          stateType: nextStateType,
        },
        select: {
          parentId: true,
        },
      });

      cascadeParentId = fullyCompleted ? updatedState.parentId : null;
      responsePayload = {
        message: fullyCompleted
          ? "Completed"
          : "Submission recorded. Awaiting teammates.",
        fullyCompleted,
        requiresAllParticipants: true,
        completedCount,
        requiredCount,
      };
    } else {
      const updatedState = await tx.actionState.update({
        where: { id: actionStateId },
        data: {
          stateType: requestedStateType,
        },
        select: {
          parentId: true,
        },
      });

      cascadeParentId = updatedState.parentId;
      responsePayload = {
        message: "Completed",
        fullyCompleted: true,
        requiresAllParticipants: false,
        completedCount: 1,
        requiredCount: 1,
      };
    }
  });

  // Cascade status updates upward if needed
  if (cascadeParentId) {
    await cascadeSubmission(cascadeParentId);
  }

  res.status(200).json(responsePayload);
});

module.exports = router;
