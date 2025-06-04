const {
    Server
} = require('socket.io');
const {
    subscribeToRedisEvents
} = require('./redisChannelBridge');
const logger = require('../utils/logger');

let io;

/**
 * Initializes Socket.IO and binds core events
 * @param {http.Server} server
 */
function initSocket(server) {
    io = new Server(server);

    io.on('connection', (socket) => {
        logger.info('🔗 Client connected');

        socket.on('joinGroup', (groupId) => {
            logger.info(`👥 Socket joined group ${groupId}`);
            socket.join(groupId);
        });

        socket.on('jobDone', (data) => {
            logger.info('✅ jobDone event received from client:', data);
            if (data?.groupId) {
                io.to(data.groupId).emit('jobDone', data);
            }
        });

        socket.on('disconnect', () => {
            logger.warn('❌ Client disconnected');
        });
    });

    subscribeToRedisEvents(io);
}

/**
 * Access the current Socket.IO instance
 */
function getIo() {
    if (!io) throw new Error('Socket.IO is not initialized');
    return io;
}

module.exports = {
    initSocket,
    getIo
};