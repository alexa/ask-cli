import {assert, expect} from "chai";
import {Observable} from "rxjs";
import sinon from "sinon";
import {EventEmitter} from "stream";
import {
  IMPORT_STATUS_AC_BUILD_FAILED_EVENT,
  IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT,
  IMPORT_STATUS_BUILDING_AC_FULL_EVENT,
  IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT,
  IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT,
  IMPORT_STATUS_IM_BUILD_FAILED_EVENT,
  IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT,
} from "../../../../lib/view/import-status/import-status-view-events";
import {ImportStatusViewObservable} from "../../../../lib/view/import-status/import-status-view-observable";

describe("Import Status View Observable test", () => {
  let importStatusViewObservable: ImportStatusViewObservable;
  let emitter: EventEmitter;

  const TEST_TASK_ID_1 = "testId1";
  const TEST_TASK_TITLE_1 = "testTitle1";
  const TEST_TASK = {
    taskId: TEST_TASK_ID_1,
    title: TEST_TASK_TITLE_1,
  };

  beforeEach(() => {
    emitter = new EventEmitter();
    importStatusViewObservable = new ImportStatusViewObservable(emitter, TEST_TASK_ID_1);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("contruct the class", () => {
    expect(importStatusViewObservable).not.equal(undefined);
    expect(importStatusViewObservable).to.be.instanceOf(ImportStatusViewObservable);
  });

  it("listens to SkillId success event and completes the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_FETCHING_SKILL_ID_SUCESS_EVENT);
  });

  it("listens to NEW SkillId success event and completes the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_FETCHING_NEW_SKILL_ID_SUCESS_EVENT);
  });

  it("listens to Import Id success event and completes the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_FETCHING_IMPORT_ID_SUCESS_EVENT);
  });

  it("listens to IM build success event and completes the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_IM_BUILD_SUCCESS_EVENT);
  });

  it("listens to IM build failed event and completes the task with an error", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        assert.fail();
      },
      error(error: Error) {
        assert.include(error.message, "build has failed", "missing IM build failed error message");
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_IM_BUILD_FAILED_EVENT);
  });

  it("listens to AC light build starting event and updates the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        expect(message).to.equal("Building Alexa Conversations light build");
        done();
      },
      complete() {
        assert.fail();
      },
    });

    emitter.emit(IMPORT_STATUS_BUILDING_AC_LIGHT_EVENT);
  });

  it("listens to AC full build starting event and updates the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        expect(message).to.equal(
          "You can now test some Alexa Conversations dialogs while we continue to train your model with additional simulated dialogs.",
        );
        done();
      },
      complete() {
        assert.fail();
      },
    });

    emitter.emit(IMPORT_STATUS_BUILDING_AC_FULL_EVENT);
  });

  it("listens to AC build success event and completes the task", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_AC_BUILD_SUCCESS_EVENT);
  });

  it("listens to AC build failed event and completes the task with an error", (done) => {
    const observable: Observable<any> = importStatusViewObservable.getObservable()(undefined, TEST_TASK);
    const fakeErrorMessage = "foo";
    observable.subscribe({
      next(message) {
        assert.fail(message);
      },
      complete() {
        assert.fail();
      },
      error(error: Error) {
        assert.include(error.message, fakeErrorMessage, "missing AC build failed error message");
        done();
      },
    });

    emitter.emit(IMPORT_STATUS_AC_BUILD_FAILED_EVENT, fakeErrorMessage);
  });
});
