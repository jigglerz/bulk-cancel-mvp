const {
    Readable
} = require('stream');
const {
    groupKey
} = require('./redisKeyBuilder');
const logger = require('./logger');

/**
 * Factory to create a CSV exporter using the provided Redis client.
 * @param {Redis} redis - An ioredis client
 * @returns {Object} - Exporter with `addRecord` and `exportAsStream`
 */
module.exports = function createCsvExporter(redis) {
    return {
        /**
         * Store a JSON record in Redis under the group's results key.
         * @param {string} groupId
         * @param {object} record
         */
        async addRecord(groupId, record) {
            const key = groupKey(groupId, 'results');
            await redis.rpush(key, JSON.stringify(record));
            logger.info(`📝 Record added to ${key}`);
        },

        /**
         * Export all stored results for the group as a CSV stream.
         * @param {string} groupId
         * @returns {Readable} - Stream of CSV data
         */
        async exportAsStream(groupId) {
            logger.info(`📦 exportAsStream called for ${groupId}`);

            const key = groupKey(groupId, 'results');
            const results = await redis.lrange(key, 0, -1);

            if (!results.length) {
                throw new Error(`No results found for group ${groupId}`);
            }

            const csvHeaders = 'ticketId,orderId,status,httpStatus,httpStatusText,timestamp\n';

            return Readable.from([
                csvHeaders,
                ...results.map(json => {
                    const r = JSON.parse(json);
                    return [
                        r.ticketId,
                        r.orderId,
                        r.status,
                        r.httpStatus,
                        `"${r.httpStatusText?.replace(/"/g, '""') || ''}"`,
                        r.timestamp
                    ].join(',') + '\n';
                })
            ]);
        }
    };
};