const redis = require('../config/redis');
const {
    REDIS_CHANNELS
} = require('../constants/redisChannels');
const logger = require('../utils/logger');

/**
 * Subscribes to Redis channels and re-emits them via Socket.IO
 * @param {Server} io - The initialized Socket.IO server
 */
function subscribeToRedisEvents(io) {
    const sub = redis.duplicate();

    sub.subscribe(REDIS_CHANNELS.JOB_DONE).then(() => {
        logger.info(`🔔 Subscribed to ${REDIS_CHANNELS.JOB_DONE}`);
    });

    sub.on('message', (channel, message) => {
        if (channel === REDIS_CHANNELS.JOB_DONE) {
            try {
                const data = JSON.parse(message);
                if (data?.groupId) {
                    logger.info(`📣 Redis→Socket emit: jobDone → group ${data.groupId}`);
                    io.to(data.groupId).emit('jobDone', data);
                } else {
                    logger.warn(`⚠️ jobDone message missing groupId: ${message}`);
                }
            } catch (err) {
                logger.error('❌ Failed to parse Redis jobDone message:', err.message);
            }
        }
    });
}

module.exports = {
    subscribeToRedisEvents
};