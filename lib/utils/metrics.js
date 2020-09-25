const { MetricClient } = require('@src/clients/metric-client');

// metric client singleton
const metricClient = new MetricClient();

module.exports = metricClient;
