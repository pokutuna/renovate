"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUpdates = void 0;
const p_all_1 = __importDefault(require("p-all"));
const config_1 = require("../../../config");
const datasource_1 = require("../../../datasource");
const logger_1 = require("../../../logger");
const manager_1 = require("../../../manager");
const types_1 = require("../../../types");
const clone_1 = require("../../../util/clone");
const package_rules_1 = require("../../../util/package-rules");
const lookup_1 = require("./lookup");
async function fetchDepUpdates(packageFileConfig, indep) {
    var _a;
    const dep = clone_1.clone(indep);
    dep.updates = [];
    if (dep.skipReason) {
        return dep;
    }
    const { manager, packageFile } = packageFileConfig;
    const { depName, currentValue } = dep;
    // TODO: fix types
    let depConfig = config_1.mergeChildConfig(packageFileConfig, dep);
    const datasourceDefaultConfig = await datasource_1.getDefaultConfig(depConfig.datasource);
    depConfig = config_1.mergeChildConfig(depConfig, datasourceDefaultConfig);
    depConfig = package_rules_1.applyPackageRules(depConfig);
    if (depConfig.ignoreDeps.includes(depName)) {
        logger_1.logger.debug({ dependency: dep.depName }, 'Dependency is ignored');
        dep.skipReason = types_1.SkipReason.Ignored;
    }
    else if ((_a = depConfig.internalPackages) === null || _a === void 0 ? void 0 : _a.includes(depName)) {
        // istanbul ignore next
        dep.skipReason = types_1.SkipReason.InternalPackage;
    }
    else if (depConfig.enabled === false) {
        logger_1.logger.debug({ dependency: dep.depName }, 'Dependency is disabled');
        dep.skipReason = types_1.SkipReason.Disabled;
    }
    else {
        if (depConfig.datasource) {
            Object.assign(dep, await lookup_1.lookupUpdates(depConfig));
        }
        else {
            dep.updates = await manager_1.getPackageUpdates(manager, depConfig);
        }
        dep.updates = dep.updates || [];
        // istanbul ignore if
        if (dep.updates.length) {
            logger_1.logger.trace({ dependency: depName }, `${dep.updates.length} result(s): ${dep.updates.map((upgrade) => upgrade.newValue)}`);
        }
        logger_1.logger.trace({
            packageFile,
            manager,
            depName,
            currentValue,
            updates: dep.updates,
        });
    }
    return dep;
}
async function fetchManagerPackagerFileUpdates(config, managerConfig, pFile) {
    const { packageFile } = pFile;
    const packageFileConfig = config_1.mergeChildConfig(managerConfig, pFile);
    const { manager } = packageFileConfig;
    const queue = pFile.deps.map((dep) => () => fetchDepUpdates(packageFileConfig, dep));
    logger_1.logger.trace({ manager, packageFile, queueLength: queue.length }, 'fetchManagerPackagerFileUpdates starting with concurrency');
    // eslint-disable-next-line no-param-reassign
    pFile.deps = await p_all_1.default(queue, { concurrency: 5 });
    logger_1.logger.trace({ packageFile }, 'fetchManagerPackagerFileUpdates finished');
}
async function fetchManagerUpdates(config, packageFiles, manager) {
    const managerConfig = config_1.getManagerConfig(config, manager);
    const queue = packageFiles[manager].map((pFile) => () => fetchManagerPackagerFileUpdates(config, managerConfig, pFile));
    logger_1.logger.trace({ manager, queueLength: queue.length }, 'fetchManagerUpdates starting');
    await p_all_1.default(queue, { concurrency: 5 });
    logger_1.logger.trace({ manager }, 'fetchManagerUpdates finished');
}
async function fetchUpdates(config, packageFiles) {
    const managers = Object.keys(packageFiles);
    const allManagerJobs = managers.map((manager) => fetchManagerUpdates(config, packageFiles, manager));
    await Promise.all(allManagerJobs);
    logger_1.logger.debug({ baseBranch: config.baseBranch }, 'Package releases lookups complete');
}
exports.fetchUpdates = fetchUpdates;
//# sourceMappingURL=fetch.js.map