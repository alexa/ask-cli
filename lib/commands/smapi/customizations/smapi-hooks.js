const appendVendorId = require('@src/commands/smapi/customizations/hook-functions/append-vendor-id');
const mapTestersEmails = require('@src/commands/smapi/customizations/hook-functions/map-testers-emails');

const events = {
    BEFORE_SEND: 'beforeSend'
};

const operationHooks = new Map();

operationHooks.set('createSkillForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('createIspForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('getIspListForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('getAlexaHostedSkillUserPermissionsV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('listInteractionModelCatalogsV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('listInteractionModelSlotTypesV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('listSkillsForVendorV1', new Map([[events.BEFORE_SEND, appendVendorId]]));
operationHooks.set('addTestersToBetaTestV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
operationHooks.set('removeTestersFromBetaTestV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
operationHooks.set('sendReminderToTestersV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));
operationHooks.set('requestFeedbackFromTestersV1', new Map([[events.BEFORE_SEND, mapTestersEmails]]));


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
