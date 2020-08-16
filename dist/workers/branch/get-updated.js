"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdatedPackageFiles = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const error_messages_1 = require("../../constants/error-messages");
const datasourceGitSubmodules = __importStar(require("../../datasource/git-submodules"));
const logger_1 = require("../../logger");
const manager_1 = require("../../manager");
const git_1 = require("../../util/git");
const auto_replace_1 = require("./auto-replace");
async function getUpdatedPackageFiles(config) {
    logger_1.logger.trace({ config });
    const { branchName, reuseExistingBranch } = config;
    logger_1.logger.debug({ reuseExistingBranch, branchName }, 'manager.getUpdatedPackageFiles()');
    const updatedFileContents = {};
    const packageFileManagers = {};
    const packageFileUpdatedDeps = {};
    const lockFileMaintenanceFiles = [];
    for (const upgrade of config.upgrades) {
        const { manager, packageFile, depName } = upgrade;
        packageFileManagers[packageFile] = manager;
        packageFileUpdatedDeps[packageFile] =
            packageFileUpdatedDeps[packageFile] || [];
        packageFileUpdatedDeps[packageFile].push(depName);
        if (upgrade.updateType === 'lockFileMaintenance') {
            lockFileMaintenanceFiles.push(packageFile);
        }
        else {
            let existingContent = updatedFileContents[packageFile];
            if (!existingContent) {
                existingContent = await git_1.getFile(packageFile, reuseExistingBranch ? config.branchName : config.baseBranch);
            }
            // istanbul ignore if
            if (config.reuseExistingBranch && !existingContent) {
                logger_1.logger.debug({ packageFile, depName }, 'Rebasing branch after file not found');
                return getUpdatedPackageFiles({
                    ...config,
                    reuseExistingBranch: false,
                });
            }
            const updateDependency = manager_1.get(manager, 'updateDependency');
            if (!updateDependency) {
                const res = await auto_replace_1.doAutoReplace(upgrade, existingContent, reuseExistingBranch);
                if (res) {
                    if (res === existingContent) {
                        logger_1.logger.debug({ packageFile, depName }, 'No content changed');
                    }
                    else {
                        logger_1.logger.debug({ packageFile, depName }, 'Contents updated');
                        updatedFileContents[packageFile] = res;
                    }
                    continue; // eslint-disable-line no-continue
                }
                else if (reuseExistingBranch) {
                    return getUpdatedPackageFiles({
                        ...config,
                        reuseExistingBranch: false,
                    });
                }
                logger_1.logger.error({ packageFile, depName }, 'Could not autoReplace');
                throw new Error(error_messages_1.WORKER_FILE_UPDATE_FAILED);
            }
            const newContent = await updateDependency({
                fileContent: existingContent,
                upgrade,
            });
            if (!newContent) {
                if (config.reuseExistingBranch) {
                    logger_1.logger.debug({ packageFile, depName }, 'Rebasing branch after error updating content');
                    return getUpdatedPackageFiles({
                        ...config,
                        reuseExistingBranch: false,
                    });
                }
                logger_1.logger.debug({ existingContent, config: upgrade }, 'Error updating file');
                throw new Error(error_messages_1.WORKER_FILE_UPDATE_FAILED);
            }
            if (newContent !== existingContent) {
                if (config.reuseExistingBranch) {
                    // This ensure it's always 1 commit from the bot
                    logger_1.logger.debug({ packageFile, depName }, 'Need to update package file so will rebase first');
                    return getUpdatedPackageFiles({
                        ...config,
                        reuseExistingBranch: false,
                    });
                }
                logger_1.logger.debug({ packageFile, depName }, 'Updating packageFile content');
                updatedFileContents[packageFile] = newContent;
            }
            if (newContent === existingContent &&
                upgrade.datasource === datasourceGitSubmodules.id) {
                updatedFileContents[packageFile] = newContent;
            }
        }
    }
    const updatedPackageFiles = Object.keys(updatedFileContents).map((name) => ({
        name,
        contents: updatedFileContents[name],
    }));
    const updatedArtifacts = [];
    const artifactErrors = [];
    for (const packageFile of updatedPackageFiles) {
        const manager = packageFileManagers[packageFile.name];
        const updatedDeps = packageFileUpdatedDeps[packageFile.name];
        const updateArtifacts = manager_1.get(manager, 'updateArtifacts');
        if (updateArtifacts) {
            const results = await updateArtifacts({
                packageFileName: packageFile.name,
                updatedDeps,
                newPackageFileContent: packageFile.contents,
                config,
            });
            if (is_1.default.nonEmptyArray(results)) {
                for (const res of results) {
                    const { file, artifactError } = res;
                    if (file) {
                        updatedArtifacts.push(file);
                    }
                    else if (artifactError) {
                        artifactErrors.push(artifactError);
                    }
                }
            }
        }
    }
    if (!config.reuseExistingBranch) {
        // Only perform lock file maintenance if it's a fresh commit
        for (const packageFile of lockFileMaintenanceFiles) {
            const manager = packageFileManagers[packageFile];
            const updateArtifacts = manager_1.get(manager, 'updateArtifacts');
            if (updateArtifacts) {
                const packageFileContents = updatedFileContents[packageFile] ||
                    (await git_1.getFile(packageFile, config.reuseExistingBranch ? config.branchName : config.baseBranch));
                const results = await updateArtifacts({
                    packageFileName: packageFile,
                    updatedDeps: [],
                    newPackageFileContent: packageFileContents,
                    config,
                });
                if (is_1.default.nonEmptyArray(results)) {
                    for (const res of results) {
                        const { file, artifactError } = res;
                        if (file) {
                            updatedArtifacts.push(file);
                        }
                        else if (artifactError) {
                            artifactErrors.push(artifactError);
                        }
                    }
                }
            }
        }
    }
    return {
        reuseExistingBranch: config.reuseExistingBranch,
        updatedPackageFiles,
        updatedArtifacts,
        artifactErrors,
    };
}
exports.getUpdatedPackageFiles = getUpdatedPackageFiles;
//# sourceMappingURL=get-updated.js.map