const { expect } = require('chai');
const commander = require('commander');
const EventEmitter = require('events');
const fs = require('fs-extra');
const sinon = require('sinon');

const Helper = require('@src/commands/autocomplete/helper');

describe('Commands autocomplete - helper test', () => {
    let helper;
    let setupShellInitFileStub;
    let cleanupShellInitFileStub;
    let initStub;
    let treeStub;
    let omeletteStub;

    const testCommander = new commander.Command();
    testCommander._name = 'test';
    testCommander.command('command-one');
    testCommander.command('command-two');
    testCommander.option('--large');
    testCommander.option('-s, --small');

    const commanders = [testCommander];
    const hints = {
        smapi: {
            '-h': {},
            '--help': {},
            'list-catalogs-for-vendor': {
                '-h': {},
                '--help': {},
                '--next-token': {},
                '--max-results': {},
                '--profile': {},
                '-p': {},
                '--full-response': {},
                '--debug': {}
            }
        }
    };

    beforeEach(() => {
        setupShellInitFileStub = sinon.stub();
        cleanupShellInitFileStub = sinon.stub();
        initStub = sinon.stub();
        treeStub = sinon.stub();

        omeletteStub = () => {
            class OmeletteStubClass extends EventEmitter {
                constructor() {
                    super();
                    this.setupShellInitFile = setupShellInitFileStub;
                    this.cleanupShellInitFile = cleanupShellInitFileStub;
                    this.init = initStub;
                    this.tree = treeStub;
                }
            }
            return new OmeletteStubClass();
        };

        helper = new Helper(omeletteStub, commanders);
    });

    it('should set up autocomplete', () => {
        const writeJSONStub = sinon.stub(fs, 'writeJSONSync');
        helper.setUpAutoComplete();

        expect(writeJSONStub.callCount).eq(1);
        expect(setupShellInitFileStub.callCount).eq(1);
    });

    it('should regenerate autocomplete hints file', () => {
        const writeJSONStub = sinon.stub(fs, 'writeJSONSync');
        helper.reloadAutoCompleteHints();

        expect(writeJSONStub.callCount).eq(1);
    });

    it('should clean up autocomplete', () => {
        helper.cleanUpAutoComplete();

        expect(cleanupShellInitFileStub.callCount).eq(1);
    });

    it('should not initialize autocomplete if hint file is not present', () => {
        sinon.stub(fs, 'existsSync').withArgs(helper.autoCompleteHintsFile).returns(false);
        helper.initAutoComplete();

        expect(initStub.callCount).eq(0);
    });

    it('initialize autocomplete if hint file is present', () => {
        sinon.stub(fs, 'existsSync').withArgs(helper.autoCompleteHintsFile).returns(true);
        sinon.stub(fs, 'readJsonSync').withArgs(helper.autoCompleteHintsFile).returns(hints);
        helper.initAutoComplete();

        expect(treeStub.callCount).eq(1);
        expect(initStub.callCount).eq(1);
    });

    afterEach(() => {
        sinon.restore();
    });
});
