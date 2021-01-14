const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

const AbstractBuildFlow = require('@src/builtins/build-flows/abstract-build-flow');
const JavaMvnBuildFlow = require('@src/builtins/build-flows/java-mvn');

describe('JavaMvnBuildFlow test', () => {
    let config;
    let execStub;
    let debugStub;
    beforeEach(() => {
        config = {
            cwd: 'cwd',
            src: 'src',
            buildFile: 'buildFile',
            doDebug: false
        };
        sinon.stub(fs, 'moveSync');
        sinon.stub(fs, 'readdirSync').returns([]);
        sinon.stub(path, 'join').returns('some-path');
        sinon.stub(AbstractBuildFlow.prototype, 'modifyZip').yields();
        execStub = sinon.stub(AbstractBuildFlow.prototype, 'execCommand');
        debugStub = sinon.stub(AbstractBuildFlow.prototype, 'debug');
    });
    describe('# inspect correctness of execute', () => {
        it('| should execute commands', (done) => {
            const buildFlow = new JavaMvnBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('mvn clean package org.apache.maven.plugins:maven-'
                + 'assembly-plugin:3.3.0:single -DdescriptorId=jar-with-dependencies');
                done();
            });
        });

        it('| should execute commands with debug', (done) => {
            config.doDebug = true;
            const buildFlow = new JavaMvnBuildFlow(config);

            buildFlow.execute((err, res) => {
                expect(err).eql(undefined);
                expect(res).eql(undefined);
                expect(execStub.args[0][0]).eql('mvn clean package org.apache.maven.plugins:maven-'
                + 'assembly-plugin:3.3.0:single -DdescriptorId=jar-with-dependencies');
                expect(debugStub.args[0][0]).eql('Building skill artifacts based on the pom.xml.');
                expect(debugStub.args[1][0]).eql('Renaming the jar file some-path to buildFile.');
                done();
            });
        });
    });

    describe('# inspect correctness of removeCommentsFromPomProperties', () => {
        it('| should remove comments from pom properties file', () => {
            const entry = {
                entryName: 'pom.properties',
                getData: () => '# some comment\n# generated at Thu Oct 22 2020 12:28:31\nsome value\nanother-value',
                setData: () => {}
            };
            const setDataSpy = sinon.spy(entry, 'setData');
            const buildFlow = new JavaMvnBuildFlow(config);
            buildFlow._removeCommentsFromPomProperties(entry);
            expect(setDataSpy.args[0][0]).eq('some value\nanother-value');
        });

        it('| should note remove comments from non pom properties file', () => {
            const entry = {
                entryName: 'other.properties',
                getData: () => '# some comment\n# generated at Thu Oct 22 2020 12:28:31\nsome value\nanother-value',
                setData: () => {}
            };
            const setDataSpy = sinon.spy(entry, 'setData');
            const buildFlow = new JavaMvnBuildFlow(config);
            buildFlow._removeCommentsFromPomProperties(entry);
            expect(setDataSpy.callCount).eq(0);
        });
    });

    afterEach(() => {
        sinon.restore();
    });
});
