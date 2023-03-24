#!/usr/bin/env node

import Messenger from "../lib/view/messenger";
import jsonView from "../lib/view/json-view";
import {makeSmapiCommander} from "../lib/commands/smapi/smapi-commander";

const commander = makeSmapiCommander();

if (!process.argv.slice(2).length) {
  commander.outputHelp();
} else {
  commander
    .parseAsync(process.argv)
    .then((result) => Messenger.getInstance().info(result))
    .catch((err) => {
      Messenger.getInstance().error(jsonView.toString(err));
      process.exit(1);
    });
}
