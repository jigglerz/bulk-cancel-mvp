const redis = require('../config/redis');
const logger = require('./logger');
const {
    groupKey,
    cancelKey
} = require('./redisKeyBuilder');

const REDIS_CHANNEL = '__job_done__';

module.exports = {
    /**
     * Notify that a job has completed.
     */
    async notifyJobDone(groupId, details) {
        const key = groupKey(groupId, 'results');
        await redis.rpush(key, JSON.stringify(details));

        const payload = {
            groupId,
            ...details
        };
        logger.info('📢 Publishing jobDone to Redis:', payload);

        await redis.publish(REDIS_CHANNEL, JSON.stringify(payload));
    },

    /**
     * Check if a group has a cancellation flag.
     */
    async isCanceled(groupId) {
        const flag = await redis.get(cancelKey(groupId));
        return flag === '1';
    },

    /**
     * Clear the cancel flag for a group.
     */
    async clearCancelFlag(groupId) {
        await redis.del(cancelKey(groupId));
        logger.info(`✅ Cancel flag cleared for group ${groupId}`);
    },

    /**
     * Clear all results for a group.
     */
    async clearResults(groupId) {
        await redis.del(groupKey(groupId, 'results'));
        logger.info(`🗑️ Cleared results for group ${groupId}`);
    },

    /**
     * Reset finished job count to 0.
     */
    async resetFinishedJobs(groupId) {
        await redis.set(groupKey(groupId, 'finishedJobs'), 0);
        logger.info(`🔁 Reset finished job count for group ${groupId}`);
    },

    /**
     * Set expected number of jobs.
     */
    async setExpectedJobCount(groupId, count) {
        await redis.set(groupKey(groupId, 'expectedJobs'), count);
        logger.info(`📌 Set expected job count for group ${groupId} to ${count}`);
    },

    /**
     * Get parsed results for a group.
     */
    async getResults(groupId) {
        const raw = await redis.lrange(groupKey(groupId, 'results'), 0, -1);
        return raw.map(r => JSON.parse(r));
    }
};