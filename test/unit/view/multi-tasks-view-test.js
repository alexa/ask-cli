const { expect } = require('chai');
const sinon = require('sinon');
const Listr = require('listr');
const { EventEmitter } = require('events');
const { Observable } = require('rxjs');
const CliError = require('@src/exceptions/cli-error');
const MultiTasksView = require('@src/view/multi-tasks-view');

const { ListrReactiveTask } = MultiTasksView;

describe('View test - MultiTasksView test', () => {
    const TEST_TASK_HANDLE = () => 'taskHandle';
    const TEST_TASK_ID = 'taskId';
    const TEST_TASK_TITLE = 'taskTitle';
    const TEST_OPTIONS = {};

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a MultiTasksView class', () => {
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            expect(multiTasks).to.be.instanceOf(MultiTasksView);
            expect(multiTasks.taskRunner).to.be.instanceOf(Listr);
        });
    });

    describe('# test class method: loadTask', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| load task instantiate a ListrReactiveTask and add it to taskRunner', () => {
            // setup
            sinon.stub(Listr.prototype, 'add');
            sinon.stub(ListrReactiveTask.prototype, 'buildObservable').returns('obsv');
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            // call
            multiTasks.loadTask(TEST_TASK_HANDLE, TEST_TASK_TITLE, TEST_TASK_ID);
            // verify
            expect(multiTasks._listrTasks.length).equal(1);
            expect(Listr.prototype.add.callCount).equal(2);
            expect(Listr.prototype.add.args[1][0]).deep.equal({ title: TEST_TASK_TITLE, task: 'obsv' });
        });
    });

    describe('# test class method: start', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('| task list is empty but still calls start function, expect callback error', (done) => {
            // setup
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            // call
            multiTasks.start((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err.error).equal('No tasks in current multi-tasks runner.');
                done();
            });
        });

        it('| task start trigger execute and taskRunner run fails', (done) => {
            // setup
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            const newTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(Listr.prototype, 'run').rejects({ errors: ['error 1', new Error('error 2')] });
            sinon.stub(ListrReactiveTask.prototype, 'execute');
            multiTasks._listrTasks.push(newTask);
            // call
            multiTasks.start((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err.error).eql(new CliError('error 1\nerror 2'));
                expect(ListrReactiveTask.prototype.execute.callCount).equal(1);
                done();
            });
        });

        it('| task start trigger execute and taskRunner run fails with partial context', (done) => {
            // setup
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            const newTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(Listr.prototype, 'run').rejects({ errors: ['error'], context: { result: 'partial' } });
            sinon.stub(ListrReactiveTask.prototype, 'execute');
            multiTasks._listrTasks.push(newTask);
            // call
            multiTasks.start((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err).deep.equal({ error: new CliError('error'), partialResult: { result: 'partial' } });
                expect(ListrReactiveTask.prototype.execute.callCount).equal(1);
                done();
            });
        });

        it('| task start trigger execute and taskRunner run succeeds', (done) => {
            // setup
            const multiTasks = new MultiTasksView(TEST_OPTIONS);
            const newTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(Listr.prototype, 'run').resolves({ result: 'pass' });
            sinon.stub(ListrReactiveTask.prototype, 'execute');
            multiTasks._listrTasks.push(newTask);
            // call
            multiTasks.start((err, res) => {
                // verify
                expect(res).deep.equal({ result: 'pass' });
                expect(err).equal(null);
                expect(ListrReactiveTask.prototype.execute.callCount).equal(1);
                done();
            });
        });
    });
});

describe('View test - ListReactiveTask test', () => {
    const TEST_TASK_HANDLE = () => 'taskHandle';
    const TEST_TASK_ID = 'taskId';

    afterEach(() => {
        sinon.restore();
    });

    describe('# inspect correctness for constructor', () => {
        it('| initiate as a ListrReactiveTask class', () => {
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            expect(rxTask).to.be.instanceOf(ListrReactiveTask);
            expect(rxTask.taskHandle).deep.equal(TEST_TASK_HANDLE);
            expect(rxTask.taskId).equal(TEST_TASK_ID);
            expect(rxTask._eventEmitter).to.be.instanceOf(EventEmitter);
        });
    });

    describe('# test class method: reporter getter', () => {
        it('| getter function returns skipTask method which emit "skip" event', () => {
            // setup
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            const emitStub = sinon.stub(rxTask._eventEmitter, 'emit');
            // call
            rxTask.reporter.skipTask('skippedReason');
            // verify
            expect(emitStub.args[0][0]).equal('skip');
            expect(emitStub.args[0][1]).equal('skippedReason');
        });

        it('| getter function returns updateStatus method which emit "status" event', () => {
            // setup
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            const emitStub = sinon.stub(rxTask._eventEmitter, 'emit');
            // call
            rxTask.reporter.updateStatus('statusUpdate');
            // verify
            expect(emitStub.args[0][0]).equal('status');
            expect(emitStub.args[0][1]).equal('statusUpdate');
        });
    });

    describe('# test class method: execute', () => {
        it('| execute task handle but callback with error, expect emit error event', () => {
            // setup
            const taskHandleStub = sinon.stub().callsArgWith(1, 'errorMessage');
            const rxTask = new ListrReactiveTask(taskHandleStub, TEST_TASK_ID);
            const emitStub = sinon.stub(rxTask._eventEmitter, 'emit');
            // call
            rxTask.execute();
            // verify
            expect(emitStub.args[0][0]).equal('error');
            expect(emitStub.args[0][1]).equal('errorMessage');
        });

        it('| execute task handle with result, expect emit complete event', () => {
            // setup
            const taskHandleStub = sinon.stub().callsArgWith(1, null, { result: 'pass' });
            const rxTask = new ListrReactiveTask(taskHandleStub, TEST_TASK_ID);
            const emitStub = sinon.stub(rxTask._eventEmitter, 'emit');
            // call
            rxTask.execute();
            // verify
            expect(emitStub.args[0][0]).equal('complete');
            expect(emitStub.args[0][1]).deep.equal({ result: 'pass' });
        });
    });

    describe('# test class method: buildObservable', () => {
        let TEST_CONTEXT = {};
        let TEST_TASK = {};

        beforeEach(() => {
            TEST_CONTEXT = {};
            TEST_TASK = {};
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| make sure method returns Observable class', () => {
            // setup
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            expect(rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK)).to.be.instanceOf(Observable);
        });

        it('| when "status" event emit, expect subscriber to call "next"', () => {
            // setup
            const subscribeStub = {
                next: sinon.stub()
            };
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('status').callsArgWith(1, 'statusUpdate');
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.next.args[0][0]).equal('statusUpdate');
        });

        it('| when "error" event emit, expect subscriber to call "error"', () => {
            // setup
            const subscribeStub = {
                error: sinon.stub()
            };
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('error').callsArgWith(1, 'error');
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.error.args[0][0]).equal('error');
        });

        it('| when "error" event emit, expect subscriber to call "error" with partial result', () => {
            // setup
            const subscribeStub = {
                error: sinon.stub()
            };
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('error').callsArgWith(1, { message: 'error', context: 'partial'});
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.error.args[0][0]).deep.equal({ message: 'error', context: 'partial'});
            expect(TEST_CONTEXT[TEST_TASK_ID]).equal('partial');
        });

        it('| when "skip" event emit, expect task to call "skip"', () => {
            // setup
            const subscribeStub = {};
            const TEST_TASK = {
              skip: sinon.stub()
            }
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('skip').callsArgWith(1, 'skippedReason');
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(TEST_TASK.skip.calledOnce).equal(true);
            expect(TEST_TASK.skip.args[0][0]).equal('skippedReason');
        });

        it('| when "title" event emit, expect task title to be set', () => {
            // setup
            const subscribeStub = {};
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('title').callsArgWith(1, 'new title');
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(TEST_TASK.title).equal('new title');
        });

        it('| when "complete" event emit, expect subscriber to call "complete"', () => {
            // setup
            const subscribeStub = {
                complete: sinon.stub()
            };
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('complete').callsArgWith(1);
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.complete.args[0][0]).equal(undefined);
        });

        it('| when "complete" event emit, expect subscriber to call "complete" with result', () => {
            // setup
            const subscribeStub = {
                complete: sinon.stub()
            };
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            sinon.stub(rxTask._eventEmitter, 'on').withArgs('complete').callsArgWith(1, 'done');
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.complete.args[0][0]).equal(undefined);
            expect(TEST_CONTEXT[TEST_TASK_ID]).equal('done');
        });
    });
});
