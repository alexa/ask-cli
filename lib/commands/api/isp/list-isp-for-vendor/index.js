const R = require('ramda');

const { AbstractCommand } = require('@src/commands/abstract-command');
const Messenger = require('@src/view/messenger');
const jsonView = require('@src/view/json-view');
const SmapiClient = require('@src/clients/smapi-client');
const optionModel = require('@src/commands/option-model');
const profileHelper = require('@src/utils/profile-helper');
const CONSTANTS = require('@src/utils/constants');
const ISP_ERROR_MESSAGE = 'isp-id-list cannot used with max-results or next-token.';

class ListISPForVendorCommand extends AbstractCommand {
    name() {
        return 'list-isp-for-vendor';
    }

    description() {
        return 'query the in-skill products for the a vendor.';
    }

    requiredOptions() {
        return [];
    }

    optionalOptions() {
        return ['stageWithoutCert', 'reference-name', 'isp-id-list', 'isp-status',
            'isp-type', 'is-associated-with-skill', 'max-results', 'next-token', 'profile', 'debug'];
    }

    handle(cmd, cb) {
        let profile, vendorId, ispIdList;
        if (cmd.ispIdList && (cmd.maxResults || cmd.nextToken)) {
            Messenger.getInstance().error(ISP_ERROR_MESSAGE);
            return cb(ISP_ERROR_MESSAGE);
        }
        try {
            profile = profileHelper.runtimeProfile(cmd.profile);
            vendorId = profileHelper.resolveVendorId(profile);
            if (cmd.ispIdList) {
                ispIdList = cmd.ispIdList.split(',').map(item => item.trim());
            }
        } catch (err) {
            Messenger.getInstance().error(err);
            return cb(err);
        }
        const stage = cmd.stage || CONSTANTS.SKILL.STAGE.DEVELOPMENT;
        const smapiClient = new SmapiClient({
            profile,
            doDebug: cmd.debug
        });
        if (cmd.maxResults || cmd.nextToken || ispIdList) {
            getIspList(vendorId, ispIdList, smapiClient, cmd, stage, (err, listResponse) => {
                if (err) {
                    Messenger.getInstance().error(err);
                    return cb(err);
                }
                Messenger.getInstance().info(jsonView.toString(listResponse));
                cb();
            });
        } else {
            traverseIspList(vendorId, ispIdList, smapiClient, cmd, stage, (err, listResult) => {
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

function getIspList(vendorId, ispIdList, smapiClient, cmd, stage, callback) {
    const queryParams = {};
    if (!ispIdList) {
        if (cmd.nextToken) {
            queryParams.nextToken = cmd.nextToken;
        }
        if (cmd.maxResults) {
            queryParams.maxResults = cmd.maxResults;
        }
    }
    smapiClient.isp.listIspForVendor(vendorId, ispIdList, stage, cmd.referenceName, cmd.status,
        cmd.type, cmd.isAssociatedWithSkill, queryParams, (err, response) => {
            if (err) {
                return callback(err);
            }
            if (response.statusCode >= 300) {
                return callback(jsonView.toString(response.body), null);
            }
            callback(null, response.body);
        });
}

function traverseIspList(vendorId, ispIdList, smapiClient, cmd, stage, callback) {
    const callApiTrack = ['isp', 'listIspForVendor'];
    const callArgv = [vendorId, ispIdList, stage, cmd.referenceName, cmd.status, cmd.type, cmd.isAssociatedWithSkill];
    const responseAccessor = 'inSkillProductSummaryList';
    const responseHandle = (res) => {
        const response = res.body;
        return {
            nextToken: response.nextToken,
            listResult: response.inSkillProductSummaryList
        };
    };
    smapiClient.listWithAutoPagination(callApiTrack, callArgv, responseAccessor, responseHandle, (err, listResult) => {
        callback(err, listResult);
    });
}

module.exports = {
    createCommand: new ListISPForVendorCommand(optionModel).createCommand()
};
