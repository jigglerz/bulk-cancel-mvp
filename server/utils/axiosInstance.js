const axios = require('axios');
const logger = require('./logger');

/**
 * Creates a configured Axios instance with interceptors.
 * @param {object} [options] - Optional config overrides
 * @param {string} [options.baseURL] - Base URL for the instance
 * @param {object} [options.headers] - Custom headers to merge
 * @returns {AxiosInstance}
 */
function createAxiosInstance(options = {}) {
    const instance = axios.create({
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        baseURL: options.baseURL || undefined
    });

    // Request Interceptor
    instance.interceptors.request.use(
        (config) => {
            logger.info(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        },
        (error) => {
            logger.error(`❌ Request error: ${error.message}`);
            return Promise.reject(error);
        }
    );

    // Response Interceptor
    instance.interceptors.response.use(
        (response) => {
            logger.info(`✅ Response: ${response.status} ${response.statusText} ${response.config.url}`);
            return response;
        },
        (error) => {
            if (error.response) {
                logger.error(`❌ Response error (${error.response.status}):`, error.response.data);
            } else if (error.request) {
                logger.error(`❌ No response received for ${error.config.url}`);
            } else {
                logger.error(`❌ Request setup error: ${error.message}`);
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

module.exports = createAxiosInstance();