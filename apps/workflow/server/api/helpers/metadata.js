const importMetadata = (metadata) =>
    Object.entries(metadata ?? {}).map(([k, v]) => ({
        key: k,
        value: v.toString(),
    }));

module.exports = {
    importMetadata,
};
