const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Checks if the CSV results for a group are ready.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
const checkCsvReady = async (req, res) => {
    const groupId = req.query.groupId;

    if (!groupId) {
        return res.status(400).send('Missing groupId');
    }

    const key = `group:${groupId}:results`;

    try {
        const length = await redis.llen(key);

        if (length > 0) {
            logger.info(`✅ CSV ready for group ${groupId}`);
            return res.status(200).send('ready');
        } else {
            logger.info(`⏳ CSV not ready for group ${groupId}`);
            return res.status(204).send('not ready');
        }
    } catch (error) {
        logger.error(`❌ Error checking CSV readiness for group ${groupId}:`, error.message);
        return res.status(500).send('Server error');
    }
};

module.exports = {
    checkCsvReady
};