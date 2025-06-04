const redis = require('../config/redis');
const createCsvExporter = require('../utils/csvExporter');
const logger = require('../utils/logger');

const CsvExporter = createCsvExporter(redis);

/**
 * Handles the CSV download request.
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
exports.downloadCsv = async (req, res) => {
  const groupId = req.body.groupId;

  if (!groupId) {
    return res.status(400).send('Missing groupId');
  }

  try {
    const csvStream = await CsvExporter.exportAsStream(groupId);

    res.setHeader('Content-Disposition', `attachment; filename="${groupId}.csv"`);
    res.setHeader('Content-Type', 'text/csv');

    csvStream.pipe(res);
  } catch (error) {
    logger.error('❌ Error generating CSV:', error.message);
    res.status(500).send(`Failed to generate CSV: ${error.message}`);
  }
};
