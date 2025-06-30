const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { permissionTypes } = require('./consts.js') || [];

function validatePermissionType(permissionType) {
    if (!permissionTypes.includes(permissionType)) {
        throw new Error(`Invalid permission type: ${permissionType}. Valid types are: ${permissionTypes.join(', ')}`);
    }
}

async function createPermission(userId, actionId, permissionType) {
    validatePermissionType(permissionType);

    const permission = await prisma.permissions.create({
        data: {
            user_id: userId,
            action_id: actionId,
            permission_type: permissionType
        }
    });

    return permission;
}

async function getPermissions(queryParams = {}) {
    const permissions = await prisma.permissions.findMany({
        where: queryParams,
    });

    return permissions;
}

async function updatePermission(permissionId, userId, actionId, permissionType) {
    validatePermissionType(permissionType);

    const updatedPermission = await prisma.permissions.update({
        where: { id: permissionId },
        data: {
            user_id: userId,
            action_id: actionId,
            permission_type: permissionType
        }
    });

    return updatedPermission;
}

async function deletePermission(permissionId) {
    await prisma.permissions.delete({ where: { id: permissionId } });
}

module.exports = {
    createPermission,
    getPermissions,
    updatePermission,
    deletePermission
};