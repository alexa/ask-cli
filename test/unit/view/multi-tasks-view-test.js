const { expect } = require('chai');
const sinon = require('sinon');
const Listr = require('listr');
const events = require('events');
const { Observable } = require('rxjs');
const CliError = require('@src/exceptions/cli-error');
const MultiTasksView = require('@src/view/multi-tasks-view');

const { ListrReactiveTask } = MultiTasksView;
const { EventEmitter } = events;

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
            sinon.stub(Listr.prototype, 'run').rejects({ errors: ['error 1', { resultMessage: 'error 2' }, new Error('error 3')] });
            sinon.stub(ListrReactiveTask.prototype, 'execute');
            multiTasks._listrTasks.push(newTask);
            // call
            multiTasks.start((err, res) => {
                // verify
                expect(res).equal(undefined);
                expect(err.error).eql(new CliError('error 1\nerror 2\nerror 3'));
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
        it('| getter function returns updateStatus method which emit "status" event', () => {
            // setup
            const emitStub = sinon.stub(events.EventEmitter.prototype, 'emit');
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            rxTask.reporter.updateStatus('statusUpdate');
            // verify
            expect(emitStub.args[0][0]).equal('status');
            expect(emitStub.args[0][1]).equal('statusUpdate');
            sinon.restore();
        });
    });

    describe('# test class method: execute', () => {
        it('| execute task handle but callback with error, expect emit error event', () => {
            // setup
            const emitStub = sinon.stub(events.EventEmitter.prototype, 'emit');
            const taskHandleStub = sinon.stub();
            taskHandleStub.callsArgWith(1, 'errorMessage');
            const rxTask = new ListrReactiveTask(taskHandleStub, TEST_TASK_ID);
            // call
            rxTask.execute();
            // verify
            expect(emitStub.args[0][0]).equal('error');
            expect(emitStub.args[0][1]).equal('errorMessage');
            sinon.restore();
        });

        it('| execute task handle but callback with error, expect emit error event', () => {
            // setup
            const emitStub = sinon.stub(events.EventEmitter.prototype, 'emit');
            const taskHandleStub = sinon.stub();
            taskHandleStub.callsArgWith(1, null, { result: 'pass' });
            const rxTask = new ListrReactiveTask(taskHandleStub, TEST_TASK_ID);
            // call
            rxTask.execute();
            // verify
            expect(emitStub.args[0][0]).equal('complete');
            expect(emitStub.args[0][1]).deep.equal({ result: 'pass' });
            sinon.restore();
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
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('status').callsArgWith(1, 'statusUpdate');
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
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
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('error').callsArgWith(1, 'error comes');
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.error.args[0][0]).equal('error comes');
        });

        it('| when "error" event emit with error.message, expect subscriber to call "error"', () => {
            // setup
            const TEST_ERROR_OBJ = {
                resultMessage: 'error'
            };
            const subscribeStub = {
                error: sinon.stub()
            };
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('error').callsArgWith(1, TEST_ERROR_OBJ);
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.error.args[0][0]).deep.equal(TEST_ERROR_OBJ);
        });

        it('| when "error" event emit with error object structure, expect subscriber to call "error" and set context', () => {
            // setup
            const TEST_ERROR_OBJ = {
                resultMessage: 'error',
                deployState: 'state'
            };
            const subscribeStub = {
                error: sinon.stub()
            };
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('error').callsArgWith(1, TEST_ERROR_OBJ);
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.error.args[0][0]).deep.equal(TEST_ERROR_OBJ);
        });

        it('| when "title" event emit, expect subscriber to call "title"', () => {
            // setup
            const subscribeStub = {};
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('title').callsArgWith(1, 'new title');
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
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
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('complete').callsArgWith(1);
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
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
            sinon.stub(events.EventEmitter.prototype, 'on').withArgs('complete').callsArgWith(1, 'done');
            const rxTask = new ListrReactiveTask(TEST_TASK_HANDLE, TEST_TASK_ID);
            // call
            const obsv = rxTask.buildObservable()(TEST_CONTEXT, TEST_TASK);
            obsv._subscribe(subscribeStub);
            // verify
            expect(subscribeStub.complete.args[0][0]).equal(undefined);
            expect(TEST_CONTEXT[TEST_TASK_ID]).equal('done');
        });
    });
});
