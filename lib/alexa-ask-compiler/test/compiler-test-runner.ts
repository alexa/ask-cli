import { expect } from 'chai';
import path from 'path';
import { Compiler } from '../src/compiler/compiler';
import { readFiles } from './file-utils';
import { execSync } from 'child_process';
import { CompilerResponse } from '../src/types';
import fs from 'fs';
import { isExportDeclaration } from 'typescript';

const PROJECT_ROOT = process.cwd();
const TESTSETS_ROOT = path.join(PROJECT_ROOT, '/test/testsets');

/**
 * Compiler Test Runner
 */
export class CompilerTestRunner {
  compiler: Compiler;

  constructor() {
    this.compiler = new Compiler();
  }

  /**
   * Runs and asserts a test set.
   * A test set name is a directory name inside the "<root>/test/testsets" directory.
   * A test set must contain:
   * 1. skill-package => the input skill package with IR modules and other dependencies such as response, slots etc.
   * 2. expected-response/modules => the expected IR module files
   * 3. expected-response/status.json => the expected compiler status
   *
   * @param testSetName Test Set Name
   */
  async runTestSet(testSetName: string) {
    const actualCompilerResponse = await this.execJar(path.join(TESTSETS_ROOT, `/${testSetName}/skill-package`));

    const expectedStatusJsonPath = path.join(TESTSETS_ROOT, `${testSetName}/expected-response/status.json`);
    const expectedCompilerResponse: CompilerResponse = JSON.parse(fs.readFileSync(expectedStatusJsonPath, 'utf-8'));
    this.assertStatus(actualCompilerResponse, expectedCompilerResponse);

    const expectedLogsRoot = path.join(TESTSETS_ROOT, `${testSetName}/expected-response/logs.json`);
    const expectedLogs: { type: string; message: string }[] = JSON.parse(fs.readFileSync(expectedLogsRoot, 'utf-8'));
    const actualLogs = actualCompilerResponse.logs;

    this.assertLogs(actualLogs, expectedLogs);

    // load expected IR Modules
    const expectedIRModulesRoot = path.join(TESTSETS_ROOT, `/${testSetName}/expected-response/modules`);
    
    const actualIRModules = this.extractModules(actualCompilerResponse);

    if (Object.entries(actualIRModules).length !== 0 || fs.existsSync(expectedIRModulesRoot)) {
      const expectedIRModules = readFiles(expectedIRModulesRoot);
      this.assertAllModules(this.sortKeys(expectedIRModules), this.sortKeys(actualIRModules));
    }
  }

  async execJar(rootDir: string): Promise<CompilerResponse> {
    const command = `java -jar ${path.join(__dirname, '../lib/compiler-1.0.jar')} ${rootDir}`;
    const compilerResponse: CompilerResponse = JSON.parse(execSync(command, { encoding: 'utf8' }));

    return compilerResponse;
  }

  extractModules(compilerResponse: CompilerResponse) {
    const files = compilerResponse.files || [];
    return files.reduce((map: any, file) => {
      map[`${file.name}.json`] = JSON.parse(file.content);
      return map;
    }, {});
  }

  private assertStatus(actualCompilerResponse: CompilerResponse, expectedResponse: CompilerResponse) {
    expect(actualCompilerResponse.status).to.equal(expectedResponse.status);
  }

  private assertLogs(
    actualLogs: { type: string; message: string }[],
    expectedLogs: { type: string; message: string }[]
  ) {
    actualLogs.forEach((actualLog, i) => {
      expect(expectedLogs[i], `Expected message: ${actualLog.message}`).to.not.be.undefined;
      expect(actualLog.message).to.match(new RegExp(expectedLogs[i].message));
      expect(actualLog.type).to.equal(expectedLogs[i].type);
    });
    expect(actualLogs.length).to.equal(expectedLogs.length);
  }

  private assertAllModules(expectedModules: { [key: string]: any }, actualModules: { [key: string]: any }) {
    expect(Object.keys(actualModules)).to.deep.equal(Object.keys(expectedModules));
    expect(actualModules).to.deep.equal(expectedModules);
  }

  private sortKeys(obj: any) {
    let sortedObj: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key: string, k: number) => {
        sortedObj[key] = obj[key];
      });
    return sortedObj;
  }
}
