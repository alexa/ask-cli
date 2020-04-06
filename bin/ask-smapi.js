#!/usr/bin/env node

require('module-alias/register');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');

const commander = makeSmapiCommander();

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    commander.parseAsync(process.argv)
        .then(response => {
            const message = response[0] ? jsonView.toString(response[0]) : 'Command executed successfully!';
            Messenger.getInstance().info(message);
        })
        .catch(err => {
            Messenger.getInstance().error(jsonView.toString(err.response));
            process.exit(1);
        });
}
