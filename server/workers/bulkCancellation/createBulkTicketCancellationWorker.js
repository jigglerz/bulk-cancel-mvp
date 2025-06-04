const {
    Worker
} = require('bullmq');
const TicketCancellationTask = require('../../tasks/TicketCancellationTask');
const logger = require('../../utils/logger');

/**
 * Creates a new BullMQ worker for ticket cancellations.
 * @param {object} options
 * @param {string} options.queueName
 * @param {object} options.connection
 * @param {object} options.redisService
 * @param {number} options.concurrency
 * @returns {Worker}
 */
function createCancellationWorker({
    queueName,
    connection,
    redisService,
    concurrency = 10
}) {
    return new Worker(queueName, async (job) => {
        if (await job.isCompleted()) {
            logger.warn(`Job ${job.id} already completed - skipping`);
            return;
        }

        try {
            const task = new TicketCancellationTask(job, {
                redisService
            });
            await task.execute();
        } catch (err) {
            logger.error(`Unhandled task failure: ${err.message}`);
            throw err;
        }
    }, {
        connection,
        concurrency,
        lockDuration: 10000,
        removeOnComplete: true,
        removeOnFail: true,
    });
}

module.exports = {
    createCancellationWorker
};
