import 'mocha';
import { CompilerTestRunner } from '../compiler-test-runner';

const compilerTestRunner = new CompilerTestRunner();

describe('Compiler', () => {
  it('compiles action declaration tests correctly', async () => {
    await compilerTestRunner.runTestSet('action-decl');
  });

  it('compiles invalid action declaration tests correctly', async () => {
    await compilerTestRunner.runTestSet('action-decl-invalid');
  });

  it('compiles type declaration tests correctly', async () => {
    await compilerTestRunner.runTestSet('type-decl');
  });

  it('compiles dialog declaration tests correctly', async () => {
    await compilerTestRunner.runTestSet('dialog-decl');
  });

  it('compiles invalid dialog declaration tests correctly', async () => {
    await compilerTestRunner.runTestSet('dialog-decl-invalid');
  });

  it('compiles call tests correctly', async () => {
    await compilerTestRunner.runTestSet('call');
  });

  it('compiles invalid call tests correctly', async () => {
    await compilerTestRunner.runTestSet('call-invalid');
  });

  it('compiles weatherbot correctly', async () => {
    await compilerTestRunner.runTestSet('weatherbot');
  });

  it('compiles pizzabot correctly', async () => {
    await compilerTestRunner.runTestSet('pizzabot');
  });

  it('compiles invalid qualified name declarations correctly', async () => {
    await compilerTestRunner.runTestSet('qualified-name-decl-invalid');
  });

});
