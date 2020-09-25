const { expect } = require('chai');
const { ModelIntrospector } = require('ask-smapi-sdk');
const parallel = require('mocha.parallel');

const { CliCustomizationProcessor } = require('@src/commands/smapi/cli-customization-processor');
const { run, startMockSmapiServer, startMockLwaServer, MockServerPort } = require('@test/test-utils');
const skillManifest = require('@test/integration/fixtures/skill-manifest.json');
const catalogUploadBody = require('@test/integration/fixtures/catalog-upload.json');
const inSkillProductRequestBody = require('@test/integration/fixtures/create-in-skill-product-request.json');
const accountLinkingRequest = require('@test/integration/fixtures/account-linking-request.json');
const interactionModel = require('@test/integration/fixtures/interaction-model.json');
const annotationSet = require('@test/integration/fixtures/annotation-set.json');
const jobDefinition = require('@test/integration/fixtures/job-definition.json');

parallel.limit(8);

const processor = new CliCustomizationProcessor();
const modelIntrospector = new ModelIntrospector();
const untestedCommands = new Set([...modelIntrospector.getOperations().keys()].map(processor.processOperationName));
const testedCommands = new Set();

const addCoveredCommand = (args) => {
    const cmd = args[1];
    if (testedCommands.has(cmd)) {
        console.warn(`${cmd} already has been covered!`);
    }
    testedCommands.add(cmd);
    untestedCommands.delete(cmd);
};

parallel('smapi command test', () => {
    const cmd = 'ask';
    const subCmd = 'smapi';
    let mockSmapiServer;
    let mockLwaServer;
    const options = { parse: true,
        env: {
            ASK_SMAPI_SERVER_BASE_URL: `http://127.0.0.1:${MockServerPort.SMAPI}`,
            ASK_LWA_TOKEN_HOST: `http://127.0.0.1:${MockServerPort.LWA}`
        } };
    const name = 'test';
    const catalogId = 'someCatalogId';
    const skillId = 'someSkillId';
    const productId = 'someProductId';
    const stage = 'development';
    const locale = 'en-US';
    const location = 'US';
    const sourceLocale = 'en-US';
    const targetLocales = 'en-GB';
    const acceptLanguage = 'en-GB';
    const cloneLocaleRequestId = 'someCloneLocaleRequestId';
    const uploadId = 'someUploadId';
    const subscriberId = 'someSubscriberId';
    const subscriptionId = 'someSubscriptionId';
    const updateRequestId = 'someUpdateRequestId';
    const imJobId = 'someIMJobId';
    const imJobStatus = 'imJobStatus';
    const imExecutionId = 'imExecutionId';
    const version = '2.0.0';
    const targetVersion = '7';
    const rollbackRequestId = 'someRollbackRequestId';
    const simulationId = 'someSimulationId';
    const slotTypeId = 'someSlotTypeId';
    const sourceAnnotationId = 'someSourceAnnotationId';
    const evaluationId = 'someEvaluationId';
    const annotationId = 'soemAnnotationId';
    const accept = 'application/json';
    const contentType = 'application/json';
    const annotationSetId = 'someAnnotationSetId';
    const updateNluAnnotationSetAnnotationsRequest = JSON.stringify(annotationSet);
    const interactionModelJobDefinition = JSON.stringify(jobDefinition);
    const annotations = JSON.stringify(
        [
            {
                uploadId: 'string',
                filePathInUpload: 'string',
                evaluationWeight: 1,
                expectedTranscription: 'string'
            }
        ]
    );
    const slotType = JSON.stringify({
        slotType: {
            name: 'string',
            description: 'string'
        },
        vendorId: 'string'
    });
    const createSubscriptionRequest = JSON.stringify(
        {
            name: 'string',
            vendorId: 'string',
            endpoint: {
                uri: 'string',
                authorization: {
                    type: 'string'
                }
            }
        }
    );
    const updateSubscriptionRequest = JSON.stringify({
        name: 'string',
        endpoint: {
            uri: 'string',
            authorization: {
                type: 'string'
            }
        }
    });
    const sslCertificatePayload = JSON.stringify({
        sslCertificate: 'string',
        regions: {
            additionalProp1: {
                sslCertificate: 'string'
            },
            additionalProp2: {
                sslCertificate: 'string'
            },
            additionalProp3: {
                sslCertificate: 'string'
            }
        }
    });
    const partETags = JSON.stringify([{ eTag: 'someEtag', partNumber: 1 }]);
    const testersEmails = 'user1@gmail.com,user2@gmail.com';

    before(async () => {
        mockSmapiServer = await startMockSmapiServer();
        mockLwaServer = await startMockLwaServer();
    });

    it('| should display vendor list', async () => {
        const args = [subCmd, 'get-vendor-list'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list skills for vendor', async () => {
        const args = [subCmd, 'list-skills-for-vendor', '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create skill for vendor', async () => {
        const args = [subCmd, 'create-skill-for-vendor', '--manifest', JSON.stringify(skillManifest)];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill status', async () => {
        const args = [subCmd, 'get-skill-status', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should display catalog list', async () => {
        const args = [subCmd, 'list-catalogs-for-vendor'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create catalog', async () => {
        const args = [subCmd, 'create-catalog', '--title', 'test',
            '--type', 'AMAZON.BroadcastChannel',
            '--usage', 'AlexaMusic.Catalog.BroadcastChannel'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get catalog information', async () => {
        const args = [subCmd, 'get-catalog', '-c', 'someCatalogId'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should associate skill with catalog', async () => {
        const args = [subCmd, 'associate-catalog-with-skill', '-c', catalogId, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should create catalog upload', async () => {
        const args = [subCmd, 'create-catalog-upload', '-c', catalogId, '--catalog-upload-request-body', JSON.stringify(catalogUploadBody)];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should display catalog list for skill', async () => {
        const args = [subCmd, 'list-catalogs-for-skill', '-s', skillId, '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should display alexa hosted skill metadata', async () => {
        const args = [subCmd, 'get-alexa-hosted-skill-metadata', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should display utterance data', async () => {
        const args = [subCmd, 'get-utterance-data', '-s', skillId, '--locale', locale, '--sort-direction', 'asc'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should add testers to beta test', async () => {
        const args = [subCmd, 'add-testers-to-beta-test', '-s', skillId, '--testers-emails', testersEmails];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get list of testers', async () => {
        const args = [subCmd, 'get-list-of-testers', '-s', skillId, '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should request feedback from testers', async () => {
        const args = [subCmd, 'request-feedback-from-testers', '-s', skillId, '--testers-emails', testersEmails];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should send reminder to testers', async () => {
        const args = [subCmd, 'send-reminder-to-testers', '-s', skillId, '--testers-emails', testersEmails];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should remove testers from beta test', async () => {
        const args = [subCmd, 'remove-testers-from-beta-test', '-s', skillId, '--testers-emails', testersEmails];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should update interaction model catalog version and return version number', async () => {
        const args = [subCmd, 'update-interaction-model-catalog-version', '-c', catalogId, '--vers', 1, '--description', 'test'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should simulate skill', async () => {
        const args = [subCmd, 'simulate-skill', '-s', skillId, '--device-locale', locale, '-g', stage, '--input-content', 'hello'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create beta test', async () => {
        const args = [subCmd, 'create-beta-test', '-s', skillId, '--feedback-email', 'someemail@email.com'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should update beta test', async () => {
        const args = [subCmd, 'update-beta-test', '-s', skillId, '--feedback-email', 'test2@gmail.com'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should retrieve beta test', async () => {
        const args = [subCmd, 'get-beta-test', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list uploads for catalog', async () => {
        const args = [subCmd, 'list-uploads-for-catalog', '-c', catalogId, '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list isp for vendor', async () => {
        const args = [subCmd, 'get-isp-list-for-vendor', '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list isp for skill id ', async () => {
        const args = [subCmd, 'get-isp-list-for-skill-id', '-s', skillId, '-g', stage, '--max-results', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update account linking', async () => {
        const args = [subCmd, 'update-account-linking-info', '-s', skillId, '-g', stage,
            '--account-linking-request', JSON.stringify(accountLinkingRequest)];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should retrieve account linking', async () => {
        const args = [subCmd, 'get-account-linking-info', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete account linking', async () => {
        const args = [subCmd, 'delete-account-linking-info', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should create isp', async () => {
        const args = [subCmd, 'create-isp-for-vendor', '--create-in-skill-product-request', JSON.stringify(inSkillProductRequestBody)];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get isp definition', async () => {
        const args = [subCmd, 'get-isp-definition', '--product-id', productId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should reset entitlement for product', async () => {
        const args = [subCmd, 'reset-entitlement-for-product', '--product-id', productId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get isp associated skills', async () => {
        const args = [subCmd, 'get-isp-associated-skills', '--product-id', productId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should disassociate isp with skill', async () => {
        const args = [subCmd, 'disassociate-isp-with-skill', '--product-id', productId, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should retrieve isp summary', async () => {
        const args = [subCmd, 'get-isp-summary', '--product-id', productId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update isp for product', async () => {
        const args = [subCmd, 'update-isp-for-product', '--product-id', productId, '-g', stage,
            '--in-skill-product', JSON.stringify(inSkillProductRequestBody)];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete isp for product', async () => {
        const args = [subCmd, 'delete-isp-for-product', '--product-id', productId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should create content upload', async () => {
        const args = [subCmd, 'create-content-upload', '-c', catalogId, '--number-of-upload-parts', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should generate credentials for alexa hosted skill', async () => {
        const args = [subCmd, 'generate-credentials-for-alexa-hosted-skill', '-s', skillId,
            '--repository-url', 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/e9ac9d7f-5c4f-4c3b-8e41-1b347f625d95',
            '--repository-type', 'GIT'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get content upload by id', async () => {
        const args = [subCmd, 'get-content-upload-by-id', '-c', catalogId, '--upload-id', uploadId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should complete catalog upload', async () => {
        const args = [subCmd, 'complete-catalog-upload', '-c', catalogId, '--upload-id', uploadId, '--part-e-tags', partETags];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list subscribers for development events', async () => {
        const args = [subCmd, 'list-subscribers-for-development-events'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create subscriber for development events', async () => {
        const args = [subCmd, 'create-subscriber-for-development-events', '--create-subscriber-request', createSubscriptionRequest];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get subscriber for development events', async () => {
        const args = [subCmd, 'get-subscriber-for-development-events', '--subscriber-id', subscriberId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set subscriber for development events', async () => {
        const args = [subCmd, 'set-subscriber-for-development-events', '--subscriber-id', subscriberId,
            '--update-subscriber-request', updateSubscriptionRequest];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete subscriber for development events', async () => {
        const args = [subCmd, 'delete-subscriber-for-development-events', '--subscriber-id', subscriberId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list subscriptions for development events', async () => {
        const args = [subCmd, 'list-subscriptions-for-development-events'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create subscription for development events', async () => {
        const args = [subCmd, 'create-subscription-for-development-events',
            '--name', 'someName', '--events', 'AlexaDevelopmentEvent.ManifestUpdat',
            '--subscriber-id', subscriberId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get subscription for development events', async () => {
        const args = [subCmd, 'get-subscription-for-development-events', '--subscription-id', subscriptionId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set subscription for development events', async () => {
        const args = [subCmd, 'set-subscription-for-development-events', '--subscription-id', subscriptionId,
            '--name', 'someName', '--events', 'AlexaDevelopmentEvent.ManifestUpdated,AlexaDevelopmentEvent.ManifestCreated'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete subscription for development events', async () => {
        const args = [subCmd, 'delete-subscription-for-development-events', '--subscription-id', subscriptionId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should generate catalog upload url', async () => {
        const args = [subCmd, 'generate-catalog-upload-url', '-c', catalogId, '--number-of-upload-parts', 1];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should associate isp with skill', async () => {
        const args = [subCmd, 'associate-isp-with-skill', '--product-id', productId, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get alexa hosted skill user permissions', async () => {
        const args = [subCmd, 'get-alexa-hosted-skill-user-permissions', '--permission', 'somePermission'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should start beta test', async () => {
        const args = [subCmd, 'start-beta-test', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should end beta test', async () => {
        const args = [subCmd, 'end-beta-test', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get certifications list', async () => {
        const args = [subCmd, 'get-certifications-list', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get certification review', async () => {
        const args = [subCmd, 'get-certification-review', '-s', skillId, '-c', catalogId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill enablement status', async () => {
        const args = [subCmd, 'get-skill-enablement-status', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should set skill enablement', async () => {
        const args = [subCmd, 'set-skill-enablement', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete skill enablement', async () => {
        const args = [subCmd, 'delete-skill-enablement', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should profile nlu', async () => {
        const args = [subCmd, 'profile-nlu', '-u', 'test', '--multi-turn-token', 'someToken', '-s', skillId, '-g', stage, '-l', locale];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get interaction model', async () => {
        const args = [subCmd, 'get-interaction-model', '-s', skillId, '-g', stage, '-l', locale];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get interaction model metadata', async () => {
        const args = [subCmd, 'get-interaction-model-metadata', '-s', skillId, '-g', stage, '-l', locale];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should set interaction model', async () => {
        const args = [subCmd, 'set-interaction-model', '-s', skillId, '-g',
            stage, '-l', locale, '--interaction-model', JSON.stringify(interactionModel)];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list interaction model catalogs', async () => {
        const args = [subCmd, 'list-interaction-model-catalogs'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create interaction model catalog', async () => {
        const args = [subCmd, 'create-interaction-model-catalog', '--catalog-name', 'name', '--catalog-description', 'someDescription'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get interaction model catalog definition', async () => {
        const args = [subCmd, 'get-interaction-model-catalog-definition', '-c', catalogId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete interaction model catalog', async () => {
        const args = [subCmd, 'delete-interaction-model-catalog', '-c', catalogId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get interaction model catalog update status', async () => {
        const args = [subCmd, 'get-interaction-model-catalog-update-status', '-c', catalogId, '--update-request-id', updateRequestId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update interaction model catalog', async () => {
        const args = [subCmd, 'update-interaction-model-catalog', '-c', catalogId, '--name', 'name', '--description', 'someDescription'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should create interaction model catalog version', async () => {
        const args = [subCmd, 'create-interaction-model-catalog-version', '-c', catalogId, '--description', 'someDescription'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get interaction model catalog version', async () => {
        const args = [subCmd, 'get-interaction-model-catalog-version', '-c', catalogId, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete interaction model catalog version', async () => {
        const args = [subCmd, 'delete-interaction-model-catalog-version', '-c', catalogId, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get interaction model catalog values', async () => {
        const args = [subCmd, 'get-interaction-model-catalog-values', '-c', catalogId, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get interaction model version', async () => {
        const args = [subCmd, 'get-interaction-model-version', '-s', skillId, '-g', stage, '-l', locale, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list interaction model versions', async () => {
        const args = [subCmd, 'list-interaction-model-versions', '-s', skillId, '-g', stage, '-l', locale];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list interaction model slot types', async () => {
        const args = [subCmd, 'list-interaction-model-slot-types'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create interaction model slot type', async () => {
        const args = [subCmd, 'create-interaction-model-slot-type', '--slot-type', slotType];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get interaction model slot type definition', async () => {
        const args = [subCmd, 'get-interaction-model-slot-type-definition', '--slot-type-id', slotTypeId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete interaction model slot type', async () => {
        const args = [subCmd, 'delete-interaction-model-slot-type', '--slot-type-id', slotTypeId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get interaction model slot type build status', async () => {
        const args = [subCmd, 'get-interaction-model-slot-type-build-status', '--slot-type-id', slotTypeId, '--update-request-id', updateRequestId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update interaction model slot type', async () => {
        const args = [subCmd, 'update-interaction-model-slot-type', '--slot-type-id', slotTypeId, '--slot-type-description', 'someDescription'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list interaction model slot type versions', async () => {
        const args = [subCmd, 'list-interaction-model-slot-type-versions', '--slot-type-id', slotTypeId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create interaction model slot type version', async () => {
        const args = [subCmd, 'create-interaction-model-slot-type-version', '--slot-type-id', slotTypeId, '--slot-type', slotType];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get interaction model slot type version', async () => {
        const args = [subCmd, 'get-interaction-model-slot-type-version', '--slot-type-id', slotTypeId, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete interaction model slot type version', async () => {
        const args = [subCmd, 'delete-interaction-model-slot-type-version', '--slot-type-id', slotTypeId, '--vers', version];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should update interaction model slot type version', async () => {
        const args = [subCmd, 'update-interaction-model-slot-type-version', '--slot-type-id', slotTypeId, '--vers', version,
            '--slot-type-description', 'someDescription'
        ];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get skill manifest', async () => {
        const args = [subCmd, 'get-skill-manifest', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update skill manifest', async () => {
        const args = [subCmd, 'update-skill-manifest', '-s', skillId, '-g', stage, '--manifest', JSON.stringify(skillManifest)];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get skill metrics', async () => {
        const args = [subCmd, 'get-skill-metrics', '-s', skillId, '--start-time', '2017-07-21T17:32:28Z',
            '--end-time', '2017-07-21T17:32:28Z', '--period', 'P3', '--metric', 'someMetric', '-g', stage, '--skill-type', 'smartHome'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set private distribution account id', async () => {
        const args = [subCmd, 'set-private-distribution-account-id', '-s', skillId, '-g', stage, '--id', 'someId'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete private distribution account id', async () => {
        const args = [subCmd, 'delete-private-distribution-account-id', '-s', skillId, '-g', stage, '--id', 'someId'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list private distribution accounts', async () => {
        const args = [subCmd, 'list-private-distribution-accounts', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill simulation', async () => {
        const args = [subCmd, 'get-skill-simulation', '-s', skillId, '-g', stage, '-i', simulationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should submit skill validation', async () => {
        const args = [subCmd, 'submit-skill-validation', '-l', locale, '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill validations', async () => {
        const args = [subCmd, 'get-skill-validations', '-s', skillId, '-i', simulationId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete skill', async () => {
        const args = [subCmd, 'delete-skill', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get ssl certificates', async () => {
        const args = [subCmd, 'get-ssl-certificates', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set ssl certificates', async () => {
        const args = [subCmd, 'set-ssl-certificates', '-s', skillId, '--ssl-certificate-payload', sslCertificatePayload];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should submit skill for certification', async () => {
        const args = [subCmd, 'submit-skill-for-certification', '-s', skillId, '--publication-method', 'MANUAL_PUBLISHING'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should withdraw skill from certification', async () => {
        const args = [subCmd, 'withdraw-skill-from-certification', '-s', skillId, '--reason', 'TEST_SKILL'];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should create export request for skill', async () => {
        const args = [subCmd, 'create-export-request-for-skill', '-s', skillId, '-g', stage];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get status of export request', async () => {
        const args = [subCmd, 'get-status-of-export-request', '--export-id', 'someExportId'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create skill package', async () => {
        const args = [subCmd, 'create-skill-package', '--location', location];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should import skill package', async () => {
        const args = [subCmd, 'import-skill-package', '--location', location, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get import status', async () => {
        const args = [subCmd, 'get-import-status', '--import-id', 'someImportId'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create upload url', async () => {
        const args = [subCmd, 'create-upload-url'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should query development audit logs', async () => {
        const args = [subCmd, 'query-development-audit-logs'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should invoke skill end point', async () => {
        const args = [subCmd, 'invoke-skill', '-s', skillId,
            '--endpoint-region', 'someRegion', '--skill-request-body', JSON.stringify({})];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should invoke skill end point', async () => {
        const args = [subCmd, 'invoke-skill-end-point', '-s', skillId, '-g', stage,
            '--endpoint-region', 'someRegion', '--skill-request-body', JSON.stringify({})];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list nlu evaluations', async () => {
        const args = [subCmd, 'list-nlu-evaluations', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get nlu evaluation', async () => {
        const args = [subCmd, 'get-nlu-evaluation', '-s', skillId, '--evaluation-id', evaluationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get result for nlu evaluations', async () => {
        const args = [subCmd, 'get-result-for-nlu-evaluations', '-s', skillId, '--evaluation-id', evaluationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list nlu annotation sets', async () => {
        const args = [subCmd, 'list-nlu-annotation-sets', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create nlu annotation set', async () => {
        const args = [subCmd, 'create-nlu-annotation-set', '-s', skillId, '-l', locale, '--name', name];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create nlu evaluations', async () => {
        const args = [subCmd, 'create-nlu-evaluations', '-g', stage, '-l', locale, '--source-annotation-id', sourceAnnotationId, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get properties for nlu annotation sets', async () => {
        const args = [subCmd, 'get-properties-for-nlu-annotation-sets', '-s', skillId, '--annotation-id', annotationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update properties for nlu annotation sets', async () => {
        const args = [subCmd, 'update-properties-for-nlu-annotation-sets', '-s', skillId, '--annotation-id', annotationId, '--name', name];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete properties for nlu annotation sets', async () => {
        const args = [subCmd, 'delete-properties-for-nlu-annotation-sets', '-s', skillId, '--annotation-id', annotationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get annotations for nlu annotation sets', async () => {
        const args = [subCmd, 'get-annotations-for-nlu-annotation-sets', '-s', skillId, '--annotation-id', annotationId, '--accept', accept];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should update annotations for nlu annotation sets', async () => {
        const args = [subCmd, 'update-annotations-for-nlu-annotation-sets', '-s', skillId,
            '--annotation-id', annotationId, '--content-type', contentType,
            '--update-nlu-annotation-set-annotations-request', updateNluAnnotationSetAnnotationsRequest];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get conflicts for interaction model conflict detection', async () => {
        const args = [subCmd, 'get-conflicts-for-interaction-model', '-s', skillId, '-l', locale, '-g', stage, '--vers', '1'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get job status for interaction model conflict detection', async () => {
        const args = [subCmd, 'get-conflict-detection-job-status-for-interaction-model', '-s', skillId, '-l', locale, '-g', stage, '--vers', '1'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill credential', async () => {
        const args = [subCmd, 'get-skill-credentials', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list asr annotation sets', async () => {
        const args = [subCmd, 'list-asr-annotation-sets', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create asr annotation set', async () => {
        const args = [subCmd, 'create-asr-annotation-set', '-s', skillId, '--name', name];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get asr annotation set', async () => {
        const args = [subCmd, 'get-asr-annotation-set', '-s', skillId, '--annotation-set-id', annotationSetId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set asr annotation set', async () => {
        const args = [subCmd, 'set-asr-annotation-set', '-s', skillId, '--annotation-set-id', annotationSetId, '--name', name];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should delete asr annotation set', async () => {
        const args = [subCmd, 'delete-asr-annotation-set', '-s', skillId, '--annotation-set-id', annotationSetId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get annotations for asr annotation set', async () => {
        const args = [subCmd, 'get-annotations-for-asr-annotation-set', '-s', skillId, '--annotation-set-id', annotationSetId, '--accept', accept];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should set annotations for asr annotation set', async () => {
        const args = [subCmd, 'set-annotations-for-asr-annotation-set', '-s', skillId, '--annotation-set-id',
            annotationSetId, '--annotations', annotations];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list asr evaluations', async () => {
        const args = [subCmd, 'list-asr-evaluations', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create asr evaluation', async () => {
        const args = [subCmd, 'create-asr-evaluation', '--stage', stage, '--locale',
            locale, '--annotation-set-id', annotationSetId, '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get asr evaluation status', async () => {
        const args = [subCmd, 'get-asr-evaluation-status', '-s', skillId, '--evaluation-id', evaluationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete asr evaluation', async () => {
        const args = [subCmd, 'delete-asr-evaluation', '-s', skillId, '--evaluation-id', evaluationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list asr evaluations results', async () => {
        const args = [subCmd, 'list-asr-evaluations-results', '-s', skillId, '--evaluation-id', evaluationId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list interaction model catalog versions', async () => {
        const args = [subCmd, 'list-interaction-model-catalog-versions', '-c', catalogId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should clone locale', async () => {
        const args = [subCmd, 'clone-locale', '-s', skillId, '--source-locale', sourceLocale, '--target-locales', targetLocales];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should get clone locale status', async () => {
        const args = [subCmd, 'get-clone-locale-status', '-s', skillId, '--clone-locale-request-id', cloneLocaleRequestId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list versions for skill', async () => {
        const args = [subCmd, 'list-versions-for-skill', '-s', skillId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should rollback skill', async () => {
        const args = [subCmd, 'rollback-skill', '-s', skillId, '--target-version', targetVersion];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get rollback for skill', async () => {
        const args = [subCmd, 'get-rollback-for-skill', '-s', skillId, '--rollback-request-id', rollbackRequestId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should publish skill', async () => {
        const args = [subCmd, 'publish-skill', '-s', skillId, '--accept-language', acceptLanguage, '--publishes-at-date', '2019-04-12T23:20:50.52Z'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get skill publications', async () => {
        const args = [subCmd, 'get-skill-publications', '-s', skillId, '--accept-language', acceptLanguage];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should list all the job defintions for IM', async () => {
        const args = [subCmd, 'list-job-definitions-for-interaction-model'];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should create job definition for IM', async () => {
        const args = [subCmd, 'create-job-definition-for-interaction-model',
            '--job-definition', interactionModelJobDefinition];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should get job definition for IM', async () => {
        const args = [subCmd, 'get-job-definition-for-interaction-model', '--job-id', imJobId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should delete job definition for IM', async () => {
        const args = [subCmd, 'delete-job-definition-for-interaction-model', '--job-id', imJobId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should set job status for IM', async () => {
        const args = [subCmd, 'set-job-status-for-interaction-model', '--job-id', imJobId, '--status', imJobStatus];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    it('| should list all the job executions for IM', async () => {
        const args = [subCmd, 'list-job-executions-for-interaction-model', '--job-id', imJobId];
        addCoveredCommand(args);
        const result = await run(cmd, args, options);
        expect(result).be.an('object');
    });

    it('| should cancel next job execution for IMJob', async () => {
        const args = [subCmd, 'cancel-next-job-execution-for-interaction-model', '--job-id', imJobId, '--execution-id', imExecutionId];
        addCoveredCommand(args);
        const result = await run(cmd, args, { ...options, parse: false });
        expect(result).include('Command executed successfully!');
    });

    after(() => {
        mockSmapiServer.kill();
        mockLwaServer.kill();
        expect(Array.from(untestedCommands), 'should not have untested commands').eql([]);
    });
});
