'use strict';

const initAWS = require('../utils/init-aws');
const chalk = require('chalk');
const sugar = require('sugar');
const profileHelper = require('../utils/profile-helper');

module.exports = {
    createCommand: (commander) => {
        commander
            .command('log')
            .usage('<-f|--function <function>> [--start-time <start-time>] [--end-time <end-time>] [--limit <number>] [--raw] [-p|--profile <profile>]')
            .description('view Cloudwatch logs for a Lambda function')
            .option('-f, --function <function>', 'display logs by Lambda function name')
            .option('--start-time <start-time>', 'start time for the log time range')
            .option('--end-time <end-time>', 'end time for the log time range')
            .option('--limit <number>', 'number of log entries to display')
            .option('--raw', 'display the logs without color or formatting')
            .option('-p, --profile <profile>', 'profile name for ask cli')
            .action(handle);

        function handle(options) {
            if (!options.function) {
                console.warn('Please input required parameter: function.');
                return;
            }
            let profile = profileHelper.runtimeProfile(options.profile);
            let aws_profile = profileHelper.getAWSProfile(profile);
            let aws = initAWS.initAWS(aws_profile);
            if (!aws) {
                return;
            }
            let cloudWatchLogsClient = new aws.CloudWatchLogs();

            let today = new Date(); // Today!
            let yesterday  = new Date();
            yesterday.setDate(today.getDate() - 1); // Yesterday!

            let startTime = options.startTime ? new sugar.Date(options.startTime).raw.getTime() : yesterday.getTime();
            let endTime = options.endTime ? new sugar.Date(options.endTime).raw.getTime() : today.getTime();
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
