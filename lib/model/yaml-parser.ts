/**
 * YAML load and dump from/to JSON object.
 * Support the loading of AWS Cloudformation intrinsinc function:
 * https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
 */

import fs from 'fs';
import yaml from 'js-yaml';

// Custom type for "!Ref"
const refYamlType = new yaml.Type('!Ref', {
    kind: 'scalar',
    resolve: (data: any) => !!data && typeof data === 'string' && data.trim().length > 0,
    construct: data => `!Ref ${data}`
});

// Custom type for "!GetAtt"
const getattYamlType = new yaml.Type('!GetAtt', {
    kind: 'scalar',
    resolve: (data: any) => !!data && typeof data === 'string' && data.trim().length > 0,
    construct: data => `!GetAtt ${data}`
});

// Create AWS schema for YAML parser
const awsSchema = yaml.JSON_SCHEMA.extend([refYamlType, getattYamlType]);

/**
 * Load the yaml file with aws's schema
 * @param {String} filePath File path for the yaml file
 */
function load(filePath: string) {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(fileData, { schema: awsSchema });
}

/**
 * Dump the yaml file by merge the new content to the original file
 * @param {String} filePath File path for the yaml file
 * @param {Object} content Content to be written into filePath
 */
function dump(filePath: string, content: any) {
    fs.writeFileSync(filePath, yaml.dump(content).replace(/: *'(.+)'/g, ': $1')); // remove the single quotes for the value
}

export default {
    load,
    dump
};
