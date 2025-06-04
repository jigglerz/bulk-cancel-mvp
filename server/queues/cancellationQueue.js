const {
    Queue
} = require('bullmq');
const redisConnection = require('../config/redis');
const QUEUE_NAMES = require('../constants/queueNames');

/**
 * Queue for handling ticket cancellation jobs.
 * @type {Queue}
 */
const cancellationQueue = new Queue(QUEUE_NAMES.TICKET_CANCELLATIONS, {
    connection: redisConnection,
});

module.exports = cancellationQueue;