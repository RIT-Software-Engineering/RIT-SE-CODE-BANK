const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


async function getAccessLevels(userId, actionId) {
  return await prisma.permission.findMany({
    where: {
      userId: userId,
      actionId: actionId
    },
    select: {
      permissionType: true
    }
  });
}

async function authorizeAccessLevel(userId, actionId, ...allowedAccessLevels) {
  try {
    const userPermissions = await getAccessLevels(userId, actionId);
    
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    // Extract permission types from the response
    const userPermissionTypes = userPermissions.map(permission => permission.permissionType);
  
    // Check if user has any of the allowed access levels
    return allowedAccessLevels.some(allowedLevel => 
      userPermissionTypes.includes(allowedLevel)
    );
  } catch (error) {
    console.error('Error in authorizeAccessLevel:', error);
    return false;
  }
};

module.exports = { authorizeAccessLevel };
