const logger = require('../utils/logger');

class BaseTask {
  /**
   * @param {object} job - BullMQ Job
   * @param {object} options
   * @param {object} options.redisService - The Redis notification layer
   */
  constructor(job, { redisService }) {
    this.groupId = job.data.groupId;
    this.jobId = job.id;
    this.redisService = redisService;
    this.startTime = Date.now();
    this.hasNotified = false;
  }

  /**
   * Abstract method to be implemented by subclasses.
   */
  async execute() {
    throw new Error(`Execute method not implemented in task class ${this.constructor.name}`);
  }

  /**
   * Send a final job completion notification.
   * Ensures only one notification per job.
   * @param {string} status - Job final status (completed, failed)
   * @param {object} details - Additional data
   */
  async notifyCompletion(status, details = {}) {
    if (this.hasNotified) return;
    this.hasNotified = true;

    const durationMs = Date.now() - this.startTime;

    const payload = {
      jobId: this.jobId,
      status,
      durationMs,
      ...details
    };

    await this.redisService.notifyJobDone(this.groupId, payload);
    logger.info(`📢 Job ${this.jobId} (${status}): Notification sent`);
  }

  /**
   * Check if this job was cancelled mid-flight.
   * @returns {boolean}
   */
  async checkCancellation() {
    const isCancelled = await this.redisService.isCanceled(this.groupId);
    if (isCancelled) {
      logger.warn(`🚫 Job ${this.jobId} skipped — cancelled by user.`);
      return true;
    }
    return false;
  }

  /**
   * Handles a failure and ensures proper error reporting.
   * @param {Error} error
   */
  async handleFailure(error) {
    logger.error(`❌ Job ${this.jobId} failed: ${error.message}`);
    await this.notifyCompletion('failed', { error: error.message });
    throw error;
  }
}

module.exports = BaseTask;
