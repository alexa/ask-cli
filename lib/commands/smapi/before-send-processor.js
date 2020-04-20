const AppConfig = require('@src/model/app-config');

class BeforeSendProcessor {
    constructor(commandName, paramsObject, modelIntrospector, profile) {
        this.params = modelIntrospector.operations.get(commandName).params;
        this.definitions = modelIntrospector.definitions;
        this.paramsObject = paramsObject;
        this.profile = profile;
    }

    processAll() {
        this.appendVendorId();
        this.mapTestersEmails();
    }

    appendVendorId() {
        const vendorId = AppConfig.getInstance().getVendorId(this.profile);
        const nonBodyParam = this.params.find(p => p.name === 'vendorId');
        if (nonBodyParam) {
            this.paramsObject.vendorId = vendorId;
            return;
        }

        const bodyParam = this.params.find(p => p.in === 'body');
        if (bodyParam && bodyParam.required && bodyParam.schema && bodyParam.schema.$ref) {
            const key = bodyParam.schema.$ref.split('/').pop();
            const definition = this.definitions.get(key);
            if (!definition.properties) return;
            if (Object.keys(definition.properties).includes('vendorId')) {
                this.paramsObject[bodyParam.name] = this.paramsObject[bodyParam.name] || {};
                this.paramsObject[bodyParam.name].vendorId = vendorId;
            }
        }
    }

    mapTestersEmails() {
        const hasTestersParam = this.params.find(p => p.in === 'body' && p.name === 'TestersRequest');
        if (hasTestersParam) {
            const { testersEmails } = this.paramsObject;
            this.paramsObject.testersRequest = {
                testers: testersEmails.map(email => ({ emailId: email }))
            };

            delete this.paramsObject.testersEmails;
        }
    }
}

module.exports = BeforeSendProcessor;
