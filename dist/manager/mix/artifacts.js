"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const shlex_1 = require("shlex");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const common_1 = require("../../util/exec/common");
const fs_1 = require("../../util/fs");
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }) {
    logger_1.logger.debug(`mix.getArtifacts(${packageFileName})`);
    if (updatedDeps.length < 1) {
        logger_1.logger.debug('No updated mix deps - returning null');
        return null;
    }
    const cwd = config.localDir;
    if (!cwd) {
        logger_1.logger.debug('No local dir specified');
        return null;
    }
    const lockFileName = 'mix.lock';
    try {
        await fs_1.writeLocalFile(packageFileName, newPackageFileContent);
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'mix.exs could not be written');
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: err.message,
                },
            },
        ];
    }
    const existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (!existingLockFileContent) {
        logger_1.logger.debug('No mix.lock found');
        return null;
    }
    const cmdParts = config.binarySource === common_1.BinarySource.Docker
        ? [
            'docker',
            'run',
            '--rm',
            `-v ${cwd}:${cwd}`,
            `-w ${cwd}`,
            'renovate/elixir mix',
        ]
        : ['mix'];
    cmdParts.push('deps.update');
    /* istanbul ignore next */
    try {
        const command = [...cmdParts, ...updatedDeps.map(shlex_1.quote)].join(' ');
        await exec_1.exec(command, { cwd });
    }
    catch (err) {
        logger_1.logger.warn({ err, message: err.message }, 'Failed to update Mix lock file');
        return [
            {
                artifactError: {
                    lockFile: lockFileName,
                    stderr: err.message,
                },
            },
        ];
    }
    const newMixLockContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (existingLockFileContent === newMixLockContent) {
        logger_1.logger.debug('mix.lock is unchanged');
        return null;
    }
    logger_1.logger.debug('Returning updated mix.lock');
    return [
        {
            file: {
                name: lockFileName,
                contents: newMixLockContent,
            },
        },
    ];
}
exports.updateArtifacts = updateArtifacts;
//# sourceMappingURL=artifacts.js.map