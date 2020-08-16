"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAllDependencies = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const config_1 = require("../../../config");
const logger_1 = require("../../../logger");
const manager_1 = require("../../../manager");
const file_match_1 = require("./file-match");
const manager_files_1 = require("./manager-files");
async function extractAllDependencies(config) {
    let managerList = manager_1.getManagerList();
    if (is_1.default.nonEmptyArray(config.enabledManagers)) {
        logger_1.logger.debug('Applying enabledManagers filtering');
        managerList = managerList.filter((manager) => config.enabledManagers.includes(manager));
    }
    const extractList = [];
    for (const manager of managerList) {
        const managerConfig = config_1.getManagerConfig(config, manager);
        managerConfig.manager = manager;
        if (manager === 'regex') {
            for (const regexManager of config.regexManagers) {
                const regexManagerConfig = config_1.mergeChildConfig(managerConfig, regexManager);
                regexManagerConfig.fileList = await file_match_1.getMatchingFiles(regexManagerConfig);
                if (regexManagerConfig.fileList.length) {
                    extractList.push(regexManagerConfig);
                }
            }
        }
        else {
            managerConfig.fileList = await file_match_1.getMatchingFiles(managerConfig);
            if (managerConfig.fileList.length) {
                extractList.push(managerConfig);
            }
        }
    }
    const extractResults = await Promise.all(extractList.map(async (managerConfig) => {
        const packageFiles = await manager_files_1.getManagerPackageFiles(managerConfig);
        return { manager: managerConfig.manager, packageFiles };
    }));
    const extractions = {};
    let fileCount = 0;
    for (const { manager, packageFiles } of extractResults) {
        if (packageFiles === null || packageFiles === void 0 ? void 0 : packageFiles.length) {
            fileCount += packageFiles.length;
            logger_1.logger.debug(`Found ${manager} package files`);
            extractions[manager] = (extractions[manager] || []).concat(packageFiles);
        }
    }
    logger_1.logger.debug(`Found ${fileCount} package file(s)`);
    return extractions;
}
exports.extractAllDependencies = extractAllDependencies;
//# sourceMappingURL=index.js.map