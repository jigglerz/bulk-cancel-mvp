const cancellationQueue = require('../../queues/cancellationQueue');
const getAuthToken = require('../../services/getAuthToken');
const redis = require('../../config/redis');
const redisNotifier = require('../../utils/redisNotifier');
const {
    getIo
} = require('../../sockets/socketManager');
const {
    resolveOrdersIds
} = require('../../services/getOrdersService');
const logger = require('../../utils/logger');

/**
 * Handle bulk ticket cancellation by queuing jobs.
 */
const bulkTicketCancel = async (req, res) => {
    const io = getIo();

    try {
        const {
            groupId,
            clientId,
            clientSecret,
            accountId,
            eventId,
            refundAmount,
            sendEmail,
            ticketListInput
        } = req.body;

        if (!groupId || !clientId || !clientSecret || !accountId || !eventId || !ticketListInput) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // 🔄 Prepare Redis state
        await redisNotifier.clearCancelFlag(groupId);
        await redisNotifier.clearResults(groupId);
        await redisNotifier.resetFinishedJobs(groupId);
        await redisNotifier.setExpectedJobCount(groupId, 0);

        // 🔐 Get token and resolve order IDs
        let token;
        try {
            token = await getAuthToken.getAuthToken(clientId, clientSecret, accountId);
        } catch (authError) {
            const status = authError.response?.status;
            if (status === 401 || status === 403 || status == 400) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized: Invalid client credentials or account ID'
                });
            }

            return res.status(500).json({
                success: false,
                error: `Auth failed: ${authError.message}`
            });
        }

        const ticketList = formatTicketList(ticketListInput);
        const orderIdMap = await resolveOrdersIds(token, eventId, ticketList);

        // 🔊 Notify UI
        io.to(groupId).emit('getTotalTickets', ticketList.length);
        io.to(groupId).emit('startCancellationProcess');

        const batches = chunkArray(ticketList, 1);
        const allQueuedJobs = [];

        for (const batch of batches) {
            for (const ticketId of batch) {
                const cancelFlag = await redis.get(`cancel:${groupId}`);
                if (cancelFlag === '1') {
                    logger.warn(`🚫 Cancellation requested — stopped dispatching at ticket ${ticketId}`);
                    break;
                }

                try {
                    const orderId = orderIdMap[ticketId];

                    // Handle ticket with no orderId
                    if (!orderId) {
                        const fakeJobId = `ticket-${ticketId}-${groupId}-invalid`;
                        await cancellationQueue.add(
                            'cancelTicket', {
                                ticketId,
                                orderId: null,
                                groupId,
                                errorMessage: 'Failed to obtain orderId — probably the ticket ID or event ID is invalid'
                            }, {
                                jobId: fakeJobId,
                                attempts: 1,
                                removeOnComplete: true,
                                removeOnFail: true
                            }
                        );

                        allQueuedJobs.push({
                            ticketId,
                            success: false,
                            jobId: fakeJobId,
                            error: 'Missing orderId'
                        });
                        continue;
                    }

                    // Queue real job
                    const job = await cancellationQueue.add(
                        'cancelTicket', {
                            authToken: token,
                            eventId,
                            ticketId,
                            orderId,
                            refundAmount,
                            sendEmail,
                            groupId
                        }, {
                            jobId: `ticket-${ticketId}-${groupId}`,
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 1000
                            },
                            removeOnComplete: true,
                            removeOnFail: true
                        }
                    );

                    allQueuedJobs.push({
                        ticketId,
                        success: true,
                        jobId: job.id
                    });

                } catch (err) {
                    logger.error(`❌ Failed to queue job for ticket ${ticketId}: ${err.message}`);
                    allQueuedJobs.push({
                        ticketId,
                        success: false,
                        error: err.message
                    });
                }
            }

            await delay(200); // Pause between batches
        }

        const successfulJobs = allQueuedJobs.filter(j => j.success);
        await redisNotifier.setExpectedJobCount(groupId, successfulJobs.length);

        return res.json({
            success: true,
            jobs: allQueuedJobs
        });

    } catch (err) {
        logger.error('❌ Error in bulkTicketCancelController:', err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

function formatTicketList(input) {
    return input
        .replace(/\./g, ',')
        .split(/[,\s\n]+/)
        .filter(ticket => ticket.trim() !== '');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    bulkTicketCancel
};