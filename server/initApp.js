const cors = require('cors');
const routes = require('./routes');
const express = require('express');
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

    app.use(notFoundHandler);
    app.use(errorHandler);
}

module.exports = {
    initApp
};