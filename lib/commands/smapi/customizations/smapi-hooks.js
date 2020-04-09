const { ModelIntrospector } = require('ask-smapi-sdk');
const appendVendorId = require('@src/commands/smapi/customizations/hook-functions/append-vendor-id');
const mapTestersEmails = require('@src/commands/smapi/customizations/hook-functions/map-testers-emails');

const events = {
    BEFORE_SEND: 'beforeSend'
};

const operationHooks = new Map();

const _autoRegisterHooks = () => {
    const modelIntrospector = new ModelIntrospector();
    const operations = modelIntrospector.getOperations();
    operations.forEach(operation => {
        operation.params.forEach(param => {
            if (param.name === 'vendorId') {
                operationHooks.set(operation.apiOperationName, new Map([[events.BEFORE_SEND, appendVendorId]]));
            }
        });
    });
};

const _manualRegisterHooks = () => {
    operationHooks.set('createIspForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
    operationHooks.set('createSkillForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));

    operationHooks.set('addTestersToBetaTestV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
    operationHooks.set('removeTestersFromBetaTestV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
    operationHooks.set('sendReminderToTestersV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
    operationHooks.set('requestFeedbackFromTestersV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
};

_autoRegisterHooks();
_manualRegisterHooks();
class SmapiHooks {
    /**
     * Returns object with available hook events.
     */
    static get hookEvents() {
        return events;
    }

    /**
     * Returns hook function.
     * @param {string} operation Name of the Swagger operation.
     * @param {string} hookName Name of the hook.
     */
    static getFunction(operation, hookName) {
        const operationHook = operationHooks.get(operation);
        if (!operationHook) return null;
        const hook = operationHook.get(hookName);
        return hook || null;
    }
}

module.exports = SmapiHooks;
