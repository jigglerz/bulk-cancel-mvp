function groupKey(groupId, suffix) {
    return `group:${groupId}:${suffix}`;
}

function cancelKey(groupId) {
    return `cancel:${groupId}`;
}

module.exports = {
    groupKey,
    cancelKey
};