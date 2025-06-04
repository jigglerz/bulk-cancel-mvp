const axios = require('axios');
const pLimit = require('p-limit');

exports.resolveOrdersIds = async (token, eventId, ticketList) => {
  const result = {};
  const headers = {
    Authorization: `Bearer ${token}`
  };

  const limit = pLimit(20); // ⛔ max requests at the same time

  const tasks = ticketList.map(ticketId =>
    limit(async () => {
      try {
        const url = `https://api.bizzabo.com/v1/events/${eventId}/registrations/${ticketId}`;
        const { data } = await axios.get(url, { headers });
        result[ticketId] = data.orderId;
      } catch (err) {
        console.error(`❌ Failed to resolve order ID for ticket ${ticketId}: ${err.message}`);
      }
    })
  );

  await Promise.all(tasks);
  return result;
};
