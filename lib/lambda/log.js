'use strict';

const initAWS = require('../utils/init-aws');
const chalk = require('chalk');
const sugar = require('sugar');

module.exports = {
    createCommand: (commander) => {
        commander
            .command('log')
            .description('Display logs of the Lambda function from CloudWatch')
            .option('-f, --function <function>', 'display logs by function name')
            .option('--start-time <start-time>', 'filter logs by start time')
            .option('--end-time <end-time>', 'filter logs by end time')
            .option('--limit <number>', 'set the lines of displayed log, default is 50 lines')
            .option('--raw', 'display raw data without colors')
            .action(handle);

        function handle(options) {
            if (!options.function) {
                console.warn('Please input required parameter: function.');
                return;
            }
            let aws = initAWS.initAWS();
            if (!aws) {
                return;
            }
            let cloudWatchLogsClient = new aws.CloudWatchLogs();
            let startTime = options.startTime ? new sugar.Date(options.startTime).raw.getTime() : 0;
            let endTime = options.endTime ? new sugar.Date(options.endTime).raw.getTime() : new Date().getTime();
            let limit = options.limit || 50;
            let params = {
                logGroupName: '/aws/lambda/' + options.function,
                startTime: startTime,
                endTime: endTime,
                limit: limit,
                interleaved: true
            };

            if (!options.raw) {
                console.log(chalk.bgYellow.bold('|=============== Display Logs ===============|'));
                console.log(chalk.yellow.bold('|==== Function Name: ' + options.function + ' ====|\n'));
            }

            cloudWatchLogsClient.filterLogEvents(params, (err, data) => {
                if (err) {
                    console.error('Log events error.\n' + err);
                } else {
                    for (let i = 0; i < data.events.length; i++) {
                        let message = data.events[i].message.trim();
                        if (options.raw) {
                            console.log(message);
                        } else {
                            if (message.startsWith('START') || message.startsWith('END')) {
                                console.log(chalk.cyan(message));
                            } else if (message.startsWith('REPORT')) {
                                console.log(chalk.bold(message + '\n'));
                            } else {
                                console.log(chalk.gray(message));
                            }
                        }
                    }
                }
            });
        }
    }
};
