const cors = require('cors');
const routes = require('./routes');
const express = require('express');
const path = require('path');

const {
    errorHandler,
    notFoundHandler
} = require('./middleware/errorHandler');

function initApp(app) {
    app.use(cors());
    app.use(express.urlencoded({
        extended: false
    }));
    app.use(express.json());

    app.use('/api', routes);

    // Serve static frontend files
    app.use(express.static(path.join(__dirname, 'public')));

    // Handle client-side routing: serve index.html for any non-API routes
    /*app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
*/
    app.use(notFoundHandler);
    app.use(errorHandler);
}

module.exports = {
    initApp
};
