require('dotenv').config();
const express = require('express');
const http = require('http');

const {
    initApp
} = require('./initApp');
const {
    initSocket
} = require('./sockets/socketManager');
const {
    initWorker: initBulkCancellationWorker
} = require('./workers/bulkCancellation/bulkTicketCancelWorker');

const app = express();
const server = http.createServer(app);

// Initialize App Middleware & Routes
initApp(app);

// Initialize WebSockets
initSocket(server);

// Start bulckCancellation background worker
initBulkCancellationWorker();

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
});