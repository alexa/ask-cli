const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');

class ListCatalogUploadsCommand extends AbstractCommand {
    name() {
        return 'list-catalog-uploads';
    }

    description() {
        return 'list all the catalog uploads information by catalog-id';
    }

    requiredOptions() {
        return ['catalog-id'];
    }

    optionalOptions() {
        return ['max-results', 'next-token', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile;
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        if (cmd.maxResults || cmd.nextToken) {
            getCatalogUploadList(smapiClient, cmd, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseCatalogUploadList(smapiClient, cmd, (err, listResult) => {
                if (err) {
                    Messenger.getInstance().error(jsonView.toString(err));
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResult));
                cb();
            });
        }
    }
}

function getCatalogUploadList(smapiClient, cmd, callback) {
    const queryParams = {
        nextToken: cmd.nextToken,
        maxResults: cmd.maxResults
    };
    smapiClient.catalog.listCatalogUploads(cmd.catalogId, queryParams, (err, response) => {
        if (err) {
            return callback(err);
        }
        if (response.statusCode >= 300) {
            return callback(jsonView.toString(response.body), null);
        }
        callback(null, response.body);
    });
}

function traverseCatalogUploadList(smapiClient, cmd, callback) {
    const callApiTrack = ['catalog', 'listCatalogUploads'];
    const callArgv = [cmd.catalogId];
    const responseAccessor = 'uploads';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.uploads
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListCatalogUploadsCommand(optionModel).createCommand()
};
