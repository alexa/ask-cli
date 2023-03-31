import {assert, expect} from "chai";
import Listr from "listr";
import sinon, {SinonSpy, SinonStub} from "sinon";
import {EventEmitter} from "stream";
import {ImportStatusView} from "../../../../lib/view/import-status/import-status-view";
import {
  IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT,
} from "../../../../lib/view/import-status/import-status-view-events";

describe("Import Status View test", () => {
  let importStatusView: ImportStatusView;
  let listrStubRun: SinonStub;
  let emitterStubEmit: SinonSpy;
  //let listrStubAdd: SinonStub;
  let listr: Listr;
  const TEST_LOCALE_1 = "firstLocale";
  const TEST_LOCALE_2 = "secondLocale";
  const TEST_SKILL_ID = "MyTestSkillId";
  const TEST_IMPORT_ID = "MyTestImportId";
  const TEST_LOCALES = [TEST_LOCALE_1, TEST_LOCALE_2];

  beforeEach(() => {
    listr = new Listr();
    listrStubRun = sinon.stub(listr, "run").resolves();
    emitterStubEmit = sinon.spy(EventEmitter.prototype, "emit");

    //listrStubAdd = sinon.stub(listr, 'add');
    importStatusView = new ImportStatusView(TEST_LOCALES, listr);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("contruct the class", () => {
    expect(importStatusView).not.equal(undefined);
    expect(importStatusView).to.be.instanceOf(ImportStatusView);
    expect(listrStubRun.called).to.be.true;
    expect(listr.tasks.length).to.be.equal(TEST_LOCALES.length + 2);
    assert.include(listr.tasks[0].title, "Retrieving skill id", "Skill id tasks should be the first task");
    assert.include(listr.tasks[1].title, "Retrieving import id", "Import id tasks should be the second task");
    assert.include(listr.tasks[2].title, TEST_LOCALE_1, "tasks 1 should be in the correct order");
    assert.include(listr.tasks[3].title, TEST_LOCALE_2, "tasks 2 should be in the correct order");
  });

  describe("displaySkillId", () => {
    it("From Configuration file updates the task", () => {
      importStatusView.displaySkillId(TEST_SKILL_ID, true);
      const isEventEmited: boolean = emitterStubEmit.calledWithExactly(IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT, TEST_SKILL_ID);
      expect(isEventEmited).to.be.true;
    });

    it("From SMAPI service updates the task", () => {
      importStatusView.displaySkillId(TEST_SKILL_ID, false);
      const isEventEmited: boolean = emitterStubEmit.calledWithExactly(IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT, TEST_SKILL_ID);
      expect(isEventEmited).to.be.true;
    });
  });

  describe("displayImportId", () => {
    it("updates the task", () => {
      importStatusView.displayImportId(TEST_IMPORT_ID);
      const isEventEmited: boolean = emitterStubEmit.calledWithExactly(IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT, TEST_IMPORT_ID);
      expect(isEventEmited).to.be.true;
    });
  });
});
