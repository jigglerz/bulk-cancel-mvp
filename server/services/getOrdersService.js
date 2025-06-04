const axios = require('axios');

exports.resolveOrdersIds = async (token, eventId, ticketList) => {
    const result = {};
    const headers = {
        Authorization: `Bearer ${token}`
    };

    await Promise.all(ticketList.map(async ticketId => {
        try {
            const url = `https://api.bizzabo.com/v1/events/${eventId}/registrations/${ticketId}`;
            const {
                data
            } = await axios.get(url, {
                headers
            });
            result[ticketId] = data.orderId;
        } catch (err) {
            console.error(`❌ Failed to resolve order ID for ticket ${ticketId}: ${err.message}`);
        }
    }));

    return result;
};