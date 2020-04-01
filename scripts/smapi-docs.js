require('module-alias/register');
const { join } = require('path');
const { readFileSync } = require('fs-extra');
const Mustache = require('mustache');

const { makeSmapiCommander } = require('@src/commands/smapi/smapi-commander');
const { SmapiDocs } = require('@src/commands/smapi/smapi-docs');

const templateName = process.argv[2] || 'github';
const templatePath = join('lib', 'commands', 'smapi', 'docs-templates', `${templateName}.mustache`);
const template = readFileSync(templatePath).toString();

const commander = makeSmapiCommander();

const docs = new SmapiDocs(commander);

const viewData = docs.generateViewData();

const generatedDocs = Mustache.render(template, viewData);

console.log(generatedDocs);
