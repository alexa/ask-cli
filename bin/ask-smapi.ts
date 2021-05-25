#!/usr/bin/env node

import 'module-alias/register';

import Messenger from '@src/view/messenger';
import jsonView from '@src/view/json-view';
import { makeSmapiCommander } from '@src/commands/smapi/smapi-commander';

const commander = makeSmapiCommander();

if (!process.argv.slice(2).length) {
    commander.outputHelp();
} else {
    commander.parseAsync(process.argv)
        .then(result => Messenger.getInstance().info(result))
        .catch(err => {
            Messenger.getInstance().error(jsonView.toString(err));
            process.exit(1);
        });
}
