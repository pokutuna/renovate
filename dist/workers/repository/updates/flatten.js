"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenUpdates = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const config_1 = require("../../../config");
const languages_1 = require("../../../constants/languages");
const datasource_1 = require("../../../datasource");
const manager_1 = require("../../../manager");
const package_rules_1 = require("../../../util/package-rules");
// Return only rules that contain an updateType
function getUpdateTypeRules(packageRules) {
    return packageRules.filter((rule) => is_1.default.nonEmptyArray(rule.updateTypes));
}
async function flattenUpdates(config, packageFiles) {
    const updates = [];
    const updateTypes = [
        'major',
        'minor',
        'patch',
        'pin',
        'digest',
        'lockFileMaintenance',
    ];
    for (const [manager, files] of Object.entries(packageFiles)) {
        const managerConfig = config_1.getManagerConfig(config, manager);
        for (const packageFile of files) {
            const packageFileConfig = config_1.mergeChildConfig(managerConfig, packageFile);
            for (const dep of packageFile.deps) {
                if (dep.updates.length) {
                    const depConfig = config_1.mergeChildConfig(packageFileConfig, dep);
                    delete depConfig.deps;
                    for (const update of dep.updates) {
                        let updateConfig = config_1.mergeChildConfig(depConfig, update);
                        delete updateConfig.updates;
                        // apply config from datasource
                        const datasourceConfig = await datasource_1.getDefaultConfig(depConfig.datasource);
                        updateConfig = config_1.mergeChildConfig(updateConfig, datasourceConfig);
                        updateConfig = package_rules_1.applyPackageRules(updateConfig);
                        // Keep only rules that haven't been applied yet (with updateTypes)
                        updateConfig.packageRules = getUpdateTypeRules(updateConfig.packageRules);
                        // apply major/minor/patch/pin/digest
                        updateConfig = config_1.mergeChildConfig(updateConfig, updateConfig[updateConfig.updateType]);
                        for (const updateType of updateTypes) {
                            delete updateConfig[updateType];
                        }
                        // Apply again in case any were added by the updateType config
                        updateConfig = package_rules_1.applyPackageRules(updateConfig);
                        delete updateConfig.packageRules;
                        updateConfig.depNameSanitized = updateConfig.depName
                            ? updateConfig.depName
                                .replace('@types/', '')
                                .replace('@', '')
                                .replace(/\//g, '-')
                                .replace(/\s+/g, '-')
                                .toLowerCase()
                            : undefined;
                        if (updateConfig.language === languages_1.LANGUAGE_DOCKER &&
                            updateConfig.depName.match(/(^|\/)node$/) &&
                            updateConfig.depName !== 'calico/node') {
                            updateConfig.managerBranchPrefix = '';
                            updateConfig.depNameSanitized = 'node';
                        }
                        delete updateConfig.repoIsOnboarded;
                        delete updateConfig.renovateJsonPresent;
                        updateConfig.baseDeps = packageFile.deps;
                        updates.push(updateConfig);
                    }
                }
            }
            if (manager_1.get(manager, 'supportsLockFileMaintenance') &&
                packageFileConfig.lockFileMaintenance.enabled) {
                // Apply lockFileMaintenance config before packageRules
                let lockFileConfig = config_1.mergeChildConfig(packageFileConfig, packageFileConfig.lockFileMaintenance);
                lockFileConfig.updateType = 'lockFileMaintenance';
                lockFileConfig = package_rules_1.applyPackageRules(lockFileConfig);
                // Apply lockFileMaintenance and packageRules again
                lockFileConfig = config_1.mergeChildConfig(lockFileConfig, lockFileConfig.lockFileMaintenance);
                lockFileConfig = package_rules_1.applyPackageRules(lockFileConfig);
                // Remove unnecessary objects
                for (const updateType of updateTypes) {
                    delete lockFileConfig[updateType];
                }
                delete lockFileConfig.packageRules;
                delete lockFileConfig.deps;
                updates.push(lockFileConfig);
            }
        }
    }
    return updates
        .filter((update) => update.enabled)
        .map((update) => config_1.filterConfig(update, 'branch'));
}
exports.flattenUpdates = flattenUpdates;
//# sourceMappingURL=flatten.js.map