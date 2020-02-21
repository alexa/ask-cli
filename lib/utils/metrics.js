const { MetricClient } = require('@src/clients/metric-client');
// const MetricConfig = require('@src/model/metric-config');
const { METRICS } = require('@src/utils/constants');
const { name, version } = require('./../../package.json');

// TODO enable when we have configure command prompting for telemetry
// const metricConfig = new MetricConfig();

const metricClient = new MetricClient({
    version,
    machineId: '', // metricConfig.machineId,
    newUser: false, // metricConfig.isNewUser(),
    clientId: name,
    serverUrl: METRICS.ENDPOINT,
    enabled: false // TODO make it dependent on configure command
});

module.exports = metricClient;
