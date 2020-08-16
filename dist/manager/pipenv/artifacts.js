"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
function getPythonConstraint(existingLockFileContent, config) {
    var _a, _b, _c, _d;
    const { compatibility = {} } = config;
    const { python } = compatibility;
    if (python) {
        logger_1.logger.debug('Using python constraint from config');
        return python;
    }
    try {
        const pipfileLock = JSON.parse(existingLockFileContent);
        if ((_b = (_a = pipfileLock === null || pipfileLock === void 0 ? void 0 : pipfileLock._meta) === null || _a === void 0 ? void 0 : _a.requires) === null || _b === void 0 ? void 0 : _b.python_version) {
            return `== ${pipfileLock._meta.requires.python_version}.*`;
        }
        if ((_d = (_c = pipfileLock === null || pipfileLock === void 0 ? void 0 : pipfileLock._meta) === null || _c === void 0 ? void 0 : _c.requires) === null || _d === void 0 ? void 0 : _d.python_full_version) {
            return `== ${pipfileLock._meta.requires.python_full_version}`;
        }
    }
    catch (err) {
        // Do nothing
    }
    return undefined;
}
async function updateArtifacts({ packageFileName: pipfileName, newPackageFileContent: newPipfileContent, config, }) {
    logger_1.logger.debug(`pipenv.updateArtifacts(${pipfileName})`);
    const cacheDir = await fs_1.ensureCacheDir('./others/pipenv', 'PIPENV_CACHE_DIR');
    logger_1.logger.debug('Using pipenv cache ' + cacheDir);
    const lockFileName = pipfileName + '.lock';
    const existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (!existingLockFileContent) {
        logger_1.logger.debug('No Pipfile.lock found');
        return null;
    }
    try {
        await fs_1.writeLocalFile(pipfileName, newPipfileContent);
        if (config.isLockFileMaintenance) {
            await fs_1.deleteLocalFile(lockFileName);
        }
        const cmd = 'pipenv lock';
        const tagConstraint = getPythonConstraint(existingLockFileContent, config);
        const execOptions = {
            extraEnv: {
                PIPENV_CACHE_DIR: cacheDir,
            },
            docker: {
                image: 'renovate/python',
                tagConstraint,
                tagScheme: 'pep440',
                preCommands: ['pip install --user pipenv'],
                volumes: [cacheDir],
            },
        };
        logger_1.logger.debug({ cmd }, 'pipenv lock command');
        await exec_1.exec(cmd, execOptions);
        const status = await git_1.getRepoStatus();
        if (!(status === null || status === void 0 ? void 0 : status.modified.includes(lockFileName))) {
            return null;
        }
        logger_1.logger.debug('Returning updated Pipfile.lock');
        return [
            {
                file: {
                    name: lockFileName,
                    contents: await fs_1.readLocalFile(lockFileName, 'utf8'),
                },
            },
        ];
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Failed to update Pipfile.lock');
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: err.message,
                },
            },
        ];
    }
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map