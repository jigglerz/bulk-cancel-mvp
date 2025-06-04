const redis = require('../../config/redis');
const {
    getIo
} = require('../../sockets/socketManager');
const logger = require('../../utils/logger');

/**
 * Sets a cancellation flag and notifies all sockets in the group.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
exports.stopBulkCancellation = async (req, res) => {
    const {
        groupId
    } = req.body;

    if (!groupId) {
        return res.status(400).json({
            success: false,
            message: 'Missing groupId',
        });
    }

    try {
        // Set cancel flag in Redis
        await redis.set(`cancel:${groupId}`, '1');
        logger.info(`❌ Cancel flag set for group ${groupId}`);

        // Notify all clients in the socket group
        const io = getIo();
        io.to(groupId).emit('jobCancelled', {
            event: 'jobCancelled',
            groupId,
            message: 'Cancellation requested by user.',
        });

        return res.json({
            success: true,
            message: `Bulk cancellation flagged for group ${groupId}`,
        });
    } catch (error) {
        logger.error(`❌ Error cancelling group ${groupId}: ${error.message}`);

        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};