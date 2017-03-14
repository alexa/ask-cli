'use strict';

const commander = require('commander');

module.exports = function() {
	let command = new commander.Command();
	command.runWith = (argString) => {
		command.parse(['node', './'].concat(argString.split(' ')));
	};
	return command;
};
