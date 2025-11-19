const importMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') {
        return [];
    }
    return Object.entries(metadata).map(([k, v]) => ({
        key: k,
        value: v !== null && v !== undefined ? v.toString() : '',
    }));
};

module.exports = {
    importMetadata,
};
