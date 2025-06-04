const BaseTask = require('./BaseTask');
const axios = require('../utils/axiosInstance');
const redisNotifier = require('../utils/redisNotifier');
const logger = require('../utils/logger');

class TicketCancellationTask extends BaseTask {
    constructor(job) {
        super(job, {
            redisService: redisNotifier
        });

        const {
            authToken,
            eventId,
            ticketId,
            orderId,
            refundAmount,
            sendEmail,
            errorMessage,
            fake
        } = job.data;

        this.authToken = authToken;
        this.eventId = eventId;
        this.ticketId = ticketId;
        this.orderId = orderId;
        this.refundAmount = refundAmount;
        this.sendEmail = sendEmail;
        this.errorMessage = errorMessage || null;
        this.fake = fake || false;
    }

    async execute() {
        try {
            if (await this.checkCancellation(this.groupId)) return;

            if (this.fake || this.errorMessage) {
                logger.warn(`🚫 Skipping fake job for ticket ${this.ticketId} — ${this.errorMessage}`);
                const result = this.buildResult('failed', 400, this.errorMessage || 'Invalid ticket', this.errorMessage || 'Invalid ticket');
                return await this.notifyCompletion(result.status, result);
            }

            if (await this.checkCancellation(this.groupId)) return;

            const result = await this.performCancellation();
            await this.notifyCompletion(result.status, result);

        } catch (error) {
            await this.handleFailure(error);
        }
    }

    async performCancellation() {
        const queryParams = new URLSearchParams({
            orderId: String(this.orderId),
            refundAmount: String(this.refundAmount),
            sendEmail: String(this.sendEmail),
            validity: 'invalid'
        });

        const url = `https://api.bizzabo.com/v1/events/${this.eventId}/registrations/${this.ticketId}/cancel?${queryParams.toString()}`;
        const config = {
            headers: {
                Authorization: `Bearer ${this.authToken}`
            }
        };

        let result = this.buildResult('unknown', null, 'unknown');

        try {
            const response = await axios.put(url, null, config);
            result.status = 'completed';
            result.httpStatus = response.status;
            result.httpStatusText = response.statusText;

            logger.info(`✅ Ticket ${this.ticketId} processed: ${response.status} ${response.statusText}`);
        } catch (error) {
            result.status = 'failed';

            if (error.response) {
                result.httpStatus = error.response.status;
                result.httpStatusText = error.response.statusText;

                const apiMessage = error.response.data?.message;
                if (apiMessage && apiMessage !== result.httpStatusText) {
                    result.errorDetail = apiMessage;
                }

                logger.error(`❌ Ticket ${this.ticketId} failed: ${result.httpStatus} ${result.httpStatusText}`);
            } else {
                result.httpStatusText = error.message;
                logger.error(`❌ Ticket ${this.ticketId} error: ${error.message}`);
            }
        }

        return result;
    }


    buildResult(status, httpStatus, httpStatusText, errorDetail = null) {
        return {
            jobId: this.jobId,
            ticketId: this.ticketId,
            orderId: this.orderId,
            status,
            httpStatus,
            httpStatusText,
            errorDetail: (errorDetail && errorDetail !== httpStatusText) ? errorDetail : null,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = TicketCancellationTask;