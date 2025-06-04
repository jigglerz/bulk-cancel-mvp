const { createCancellationWorker } = require('./createBulkTicketCancellationWorker');
const { attachWorkerListeners } = require('./attachBulkCancellationWorkerListener');
const redisConnection = require('../../config/redis');
const redisNotifier = require('../../utils/redisNotifier');
const logger = require('../../utils/logger');

/**
 * Initializes the cancellation worker
 */
function initWorker() {
  const worker = createCancellationWorker({
    queueName: process.env.QUEUE_NAME || 'ticketCancellations',
    connection: redisConnection,
    redisService: redisNotifier,
    concurrency: 10,
  });

  attachWorkerListeners(worker);
  logger.info('🎯 Cancellation worker initialized');
}

module.exports = { initWorker };
