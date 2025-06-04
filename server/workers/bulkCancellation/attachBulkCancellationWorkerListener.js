const {
    WORKER_EVENTS
} = require('../../constants/workerEvents');
const logger = require('../../utils/logger');

/**
 * Attaches lifecycle event listeners to the BullMQ worker
 * @param {Worker} worker
 */
function attachWorkerListeners(worker) {
    try {
        worker.on(WORKER_EVENTS.FAILED, async (job, err) => {
            logger.error(`Job ${job.id} failed: ${err.message}`);
            if (job.attemptsMade >= job.opts.attempts) {
                await job.remove();
                logger.info(`Removed failed job ${job.id}`);
            }
        });

        worker.on(WORKER_EVENTS.PROGRESS, (job, progress) => {
            logger.info(`Job ${job.id} progress: ${progress}%`);
        });

        worker.on(WORKER_EVENTS.COMPLETED, (job) => {
            logger.info(`Job ${job.id} completed`);
        });

        worker.on(WORKER_EVENTS.ERROR, (err) => {
            logger.error('Worker error:', err);
        });
    } catch (err) {
        logger.error('Failed to attach worker listeners:', err);
    }
}

module.exports = {
    attachWorkerListeners
};