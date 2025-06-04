class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        message: err.message || 'Internal Server Error',
    };

    if (err.details) {
        response.details = err.details;
    }

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }

    console.error(`❌ Error: ${err.message}`, err.stack);

    res.status(statusCode).json(response);
}

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        // Remove stack in production
        ...(process.env.NODE_ENV === 'development' && {
            stack: new Error().stack
        })
    });
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler
};