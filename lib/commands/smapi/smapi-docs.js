const smapiCommandDescription = 'Provides a number of subcommands that '
+ 'map 1:1 to the underlying API operations in Alexa Skill Management API (SMAPI).'
+ 'The commands allow detailed control of API inputs and expose raw outputs. '
+ 'There are subcommands for creating and updating the skill, interaction model, '
+ 'and account linking information as well as starting the skill certification process.';

class SmapiDocs {
    constructor(commander) {
        this.commander = commander;
        this.commands = commander.commands;
    }

    _makeOptionsString(options) {
        return options.map(option => {
            const { mandatory, flags } = option;
            const prefix = mandatory ? '<' : '[';
            const suffix = mandatory ? '>' : ']';
            return `${prefix}${flags.split(',').join('|')}${suffix}`;
        }).join(' ');
    }

    _cleanDescription(description = '') {
        let cleanedDescription = description.trim();
        if (cleanedDescription.length > 1 && !cleanedDescription.endsWith('.')) {
            cleanedDescription = `${cleanedDescription}.`;
        }
        // adding new line before * to correctly render list in markdown
        return cleanedDescription.replace('*', '\n*');
    }

    generateViewData() {
        const commands = this.commands.map(command => {
            const parsedCommand = {
                name: command._name,
                description: this._cleanDescription(command._description),
                optionsString: this._makeOptionsString(command.options),
                options: command.options.map(option => ({ name: option.flags, description: this._cleanDescription(option.description) }))
            };
            return parsedCommand;
        });
        return { smapiCommandDescription,
            baseCommand: 'ask smapi',
            commands };
    }
}

module.exports = { SmapiDocs };
