"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const shlex_1 = require("shlex");
const toml_1 = require("toml");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
function getPythonConstraint(existingLockFileContent, config) {
    var _a, _b;
    const { compatibility = {} } = config;
    const { python } = compatibility;
    if (python) {
        logger_1.logger.debug('Using python constraint from config');
        return python;
    }
    try {
        const data = toml_1.parse(existingLockFileContent);
        if ((_a = data === null || data === void 0 ? void 0 : data.metadata) === null || _a === void 0 ? void 0 : _a['python-versions']) {
            return (_b = data === null || data === void 0 ? void 0 : data.metadata) === null || _b === void 0 ? void 0 : _b['python-versions'];
        }
    }
    catch (err) {
        // Do nothing
    }
    return undefined;
}
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }) {
    var _a;
    logger_1.logger.debug(`poetry.updateArtifacts(${packageFileName})`);
    if (!is_1.default.nonEmptyArray(updatedDeps) && !config.isLockFileMaintenance) {
        logger_1.logger.debug('No updated poetry deps - returning null');
        return null;
    }
    // Try poetry.lock first
    let lockFileName = fs_1.getSiblingFileName(packageFileName, 'poetry.lock');
    let existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (!existingLockFileContent) {
        // Try pyproject.lock next
        lockFileName = fs_1.getSiblingFileName(packageFileName, 'pyproject.lock');
        existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
        if (!existingLockFileContent) {
            logger_1.logger.debug(`No lock file found`);
            return null;
        }
    }
    logger_1.logger.debug(`Updating ${lockFileName}`);
    try {
        await fs_1.writeLocalFile(packageFileName, newPackageFileContent);
        const cmd = [];
        if (config.isLockFileMaintenance) {
            await fs_1.deleteLocalFile(lockFileName);
            cmd.push('poetry update --lock --no-interaction');
        }
        else {
            for (let i = 0; i < updatedDeps.length; i += 1) {
                const dep = updatedDeps[i];
                cmd.push(`poetry update --lock --no-interaction ${shlex_1.quote(dep)}`);
            }
        }
        const tagConstraint = getPythonConstraint(existingLockFileContent, config);
        const poetryRequirement = ((_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.poetry) || 'poetry';
        const poetryInstall = 'pip install ' + shlex_1.quote(poetryRequirement);
        const execOptions = {
            cwdFile: packageFileName,
            docker: {
                image: 'renovate/python',
                tagConstraint,
                tagScheme: 'poetry',
                preCommands: [poetryInstall],
            },
        };
        await exec_1.exec(cmd, execOptions);
        const newPoetryLockContent = await fs_1.readLocalFile(lockFileName, 'utf8');
        if (existingLockFileContent === newPoetryLockContent) {
            logger_1.logger.debug(`${lockFileName} is unchanged`);
            return null;
        }
        logger_1.logger.debug(`Returning updated ${lockFileName}`);
        return [
            {
                file: {
                    name: lockFileName,
                    contents: newPoetryLockContent,
                },
            },
        ];
    }
    catch (err) {
        logger_1.logger.debug({ err }, `Failed to update ${lockFileName} file`);
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: `${err.stdout}\n${err.stderr}`,
                },
            },
        ];
    }
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map