const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { metadataTypes } = require('./consts.js') || [];

function validateMetadataType(metadataType) {
    if (!metadataTypes.includes(metadataType)) {
        throw new Error(`Invalid metadata type: ${metadataType}. Valid types are: ${metadataTypes.join(', ')}`);
    }
}

async function createMetadata(actionId, key, value, metadataType) {
    validateMetadataType(metadataType);

    const metadata = await prisma.metadata.create({
        data: {
            action_id: actionId,
            key: key,
            value: value,
            metadata_type: metadataType
        }
    });

    return metadata;
}

async function getMetadata(queryParams = {}) {
    const metadatas = await prisma.metadata.findMany({
        where: queryParams,
    });

    return metadatas;
}

async function updateMetadata(metadataId, actionId, key, value, metadataType) {
    validateMetadataType(metadataType);

    const updatedMetadata = await prisma.metadata.update({
        where: { id: metadataId },
        data: {
            action_id: actionId,
            key: key,
            value: value,
            metadata_type: metadataType
        }
    });

    return updatedMetadata;
}

async function deleteMetadata(metadataId) {
    await prisma.metadata.delete({ where: { id: metadataId } });
}

module.exports = {
    createMetadata,
    getMetadata,
    updateMetadata,
    deleteMetadata
};