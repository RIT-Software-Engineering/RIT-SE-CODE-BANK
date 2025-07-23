const importMetadata = (metadata) =>
    Object.entries(metadata).map(([k, v]) => ({
        key: k,
        value: v,
    }));

module.exports = {
    importMetadata,
};
