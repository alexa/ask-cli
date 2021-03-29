import fs from 'fs';
import path from 'path';

/**
 * Converts a directory content in to a hashmap,
 * where key is file name and value is the parsed JSON object of the JSON file content.
 *
 * @param root Root of the directory
 */
export const readFiles = (root: string) => {
  const filenames = fs.readdirSync(root);

  const result = filenames.reduce((map: any, fileName) => {
    const fileContent = fs.readFileSync(path.join(root, fileName), 'utf-8');
    map[fileName] = JSON.parse(fileContent);
    return map;
  }, {});

  return result;
};
