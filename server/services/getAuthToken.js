const axios = require('../utils/axiosInstance');
const logger = require('../utils/logger');

const AUTH_URL = 'https://auth.bizzabo.com/oauth/token';
const AUDIENCE = 'https://api.bizzabo.com/api';

/**
 * Retrieves a Bizzabo OAuth token using client credentials.
 * Retries on transient errors using dynamic import of `p-retry`.
 * 
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} accountId
 * @returns {Promise<string>} Access token
 */
async function getAuthToken(clientId, clientSecret, accountId) {
    const payload = {
        client_id: clientId,
        client_secret: clientSecret,
        audience: AUDIENCE,
        grant_type: 'client_credentials',
        account_id: accountId
    };

    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const fetchToken = async () => {
        const {
            data
        } = await axios.post(AUTH_URL, payload, config);
        return data.access_token;
    };

    try {
        const {
            default: pRetry
        } = await import('p-retry');
        return await pRetry(fetchToken, {
            retries: 2,
            onFailedAttempt: (err) => {
                logger.warn(`🔁 Retry ${err.attemptNumber} for token request — ${err.message}`);
            },
        });
    } catch (err) {
        const errorDesc = err.response?.data?.error_description || err.message;
        logger.error(`❌ Auth failed: ${errorDesc}`);
        throw err;
    }
}

module.exports = {
    getAuthToken,
};