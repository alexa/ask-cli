const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const jsonView = require('@src/view/json-view');
const DialogSaveSkillIoFile = require('@src/model/dialog-save-skill-io-file');

describe('Model test - dialog output file test', () => {
    const outputFilePath = 'somePath';
    let writeFileStub;
    beforeEach(() => {
        writeFileStub = sinon.stub(fs, 'writeFileSync');
    });

    it('| should write dialog history to a file', () => {
        const dialogOutputFile = new DialogSaveSkillIoFile(outputFilePath);

        dialogOutputFile.startInvocation({ someItem: 'some start item' });
        dialogOutputFile.endInvocation({ someItem: 'some end item' });
        dialogOutputFile.startInvocation({ someItem: 'another start item' });
        dialogOutputFile.endInvocation({ someItem: 'another  end item' });

        dialogOutputFile.save();

        const expectedContent = {
            invocations: [
                {
                    request: {
                        someItem: 'some start item'
                    },
                    response: {
                        someItem: 'some end item'
                    }
                },
                {
                    request: {
                        someItem: 'another start item'
                    },
                    response: {
                        someItem: 'another  end item'
                    }
                }
            ]
        };

        expect(dialogOutputFile).to.be.instanceof(DialogSaveSkillIoFile);
        expect(writeFileStub.callCount).eq(1);
        expect(writeFileStub.args[0][0]).eq(outputFilePath);
        expect(writeFileStub.args[0][1]).eq(jsonView.toString((expectedContent)));
    });

    it('| should not write to file if no output path provided', () => {
        const dialogOutputFile = new DialogSaveSkillIoFile();

        dialogOutputFile.endInvocation({ someItem: 'some end item' });

        dialogOutputFile.save();

        expect(dialogOutputFile).to.be.instanceof(DialogSaveSkillIoFile);
        expect(writeFileStub.callCount).eq(0);
    });

    afterEach(() => {
        sinon.restore();
    });
});
