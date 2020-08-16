"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArtifacts = void 0;
const shlex_1 = require("shlex");
const logger_1 = require("../../logger");
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config, }) {
    logger_1.logger.debug(`cargo.updateArtifacts(${packageFileName})`);
    if (updatedDeps === undefined || updatedDeps.length < 1) {
        logger_1.logger.debug('No updated cargo deps - returning null');
        return null;
    }
    const lockFileName = fs_1.getSiblingFileName(packageFileName, 'Cargo.lock');
    const existingLockFileContent = await fs_1.readLocalFile(lockFileName);
    if (!existingLockFileContent) {
        logger_1.logger.debug('No Cargo.lock found');
        return null;
    }
    try {
        await fs_1.writeLocalFile(packageFileName, newPackageFileContent);
        logger_1.logger.debug('Updating ' + lockFileName);
        for (let i = 0; i < updatedDeps.length; i += 1) {
            const dep = updatedDeps[i];
            // Update dependency `${dep}` in Cargo.lock file corresponding to Cargo.toml file located
            // at ${localPackageFileName} path
            let cmd = `cargo update --manifest-path ${shlex_1.quote(packageFileName)} --package ${shlex_1.quote(dep)}`;
            const execOptions = {
                docker: {
                    image: 'renovate/rust',
                },
            };
            try {
                await exec_1.exec(cmd, execOptions);
            }
            catch (err) /* istanbul ignore next */ {
                // Two different versions of one dependency can be present in the same
                // crate, and when that happens an attempt to update it with --package ${dep}
                // key results in cargo exiting with error code `101` and an error mssage:
                // "error: There are multiple `${dep}` packages in your project".
                //
                // If exception `err` was caused by this, we execute `updateAll` function
                // instead of returning an error. `updateAll` function just executes
                // "cargo update --manifest-path ${localPackageFileName}" without the `--package` key.
                //
                // If exception `err` was not caused by this, we just rethrow it. It will be caught
                // by the outer try { } catch {} and processed normally.
                const msgStart = 'error: There are multiple';
                if (err.code === 101 && err.stderr.startsWith(msgStart)) {
                    cmd = cmd.replace(/ --package.*/, '');
                    await exec_1.exec(cmd, execOptions);
                }
                else {
                    throw err; // this is caught below
                }
            }
        }
        logger_1.logger.debug('Returning updated Cargo.lock');
        const newCargoLockContent = await fs_1.readLocalFile(lockFileName);
        if (existingLockFileContent === newCargoLockContent) {
            logger_1.logger.debug('Cargo.lock is unchanged');
            return null;
        }
        return [
            {
                file: {
                    name: lockFileName,
                    contents: newCargoLockContent,
                },
            },
        ];
    }
    catch (err) {
        logger_1.logger.warn({ err }, 'Failed to update Cargo lock file');
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