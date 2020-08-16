"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLockFile = void 0;
const semver_1 = require("semver");
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const error_messages_1 = require("../../../constants/error-messages");
const logger_1 = require("../../../logger");
const exec_1 = require("../../../util/exec");
const fs_1 = require("../../../util/fs");
const node_version_1 = require("./node-version");
async function generateLockFile(cwd, env, filename, config = {}, upgrades = []) {
    var _a, _b, _c;
    logger_1.logger.debug(`Spawning npm install to create ${cwd}/${filename}`);
    const { skipInstalls, postUpdateOptions } = config;
    let lockFile = null;
    try {
        let installNpm = 'npm i -g npm';
        const npmCompatibility = (_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.npm;
        if (semver_1.validRange(npmCompatibility)) {
            installNpm += `@${shlex_1.quote(npmCompatibility)}`;
        }
        const preCommands = [installNpm];
        const commands = [];
        let cmdOptions = '';
        if ((postUpdateOptions === null || postUpdateOptions === void 0 ? void 0 : postUpdateOptions.includes('npmDedupe')) || skipInstalls === false) {
            logger_1.logger.debug('Performing node_modules install');
            cmdOptions += '--ignore-scripts --no-audit';
        }
        else {
            logger_1.logger.debug('Updating lock file only');
            cmdOptions += '--package-lock-only --ignore-scripts --no-audit';
        }
        const tagConstraint = await node_version_1.getNodeConstraint(config);
        const execOptions = {
            cwd,
            extraEnv: {
                NPM_CONFIG_CACHE: env.NPM_CONFIG_CACHE,
                npm_config_store: env.npm_config_store,
            },
            docker: {
                image: 'renovate/node',
                tagScheme: 'npm',
                tagConstraint,
                preCommands,
            },
        };
        if (config.dockerMapDotfiles) {
            const homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
            const homeNpmrc = upath_1.join(homeDir, '.npmrc');
            execOptions.docker.volumes = [[homeNpmrc, '/home/ubuntu/.npmrc']];
        }
        if (!upgrades.every((upgrade) => upgrade.isLockfileUpdate)) {
            // This command updates the lock file based on package.json
            commands.push(`npm install ${cmdOptions}`.trim());
        }
        // rangeStrategy = update-lockfile
        const lockUpdates = upgrades.filter((upgrade) => upgrade.isLockfileUpdate);
        if (lockUpdates.length) {
            logger_1.logger.debug('Performing lockfileUpdate (npm)');
            const updateCmd = `npm install ${cmdOptions}` +
                lockUpdates
                    .map((update) => ` ${update.depName}@${update.toVersion}`)
                    .join('');
            commands.push(updateCmd);
        }
        // postUpdateOptions
        if ((_b = config.postUpdateOptions) === null || _b === void 0 ? void 0 : _b.includes('npmDedupe')) {
            logger_1.logger.debug('Performing npm dedupe');
            commands.push('npm dedupe');
        }
        if (upgrades.find((upgrade) => upgrade.isLockFileMaintenance)) {
            const lockFileName = upath_1.join(cwd, filename);
            logger_1.logger.debug(`Removing ${lockFileName} first due to lock file maintenance upgrade`);
            try {
                await fs_1.remove(lockFileName);
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ err, lockFileName }, 'Error removing yarn.lock for lock file maintenance');
            }
        }
        // Run the commands
        await exec_1.exec(commands, execOptions);
        // massage to shrinkwrap if necessary
        if (filename === 'npm-shrinkwrap.json' &&
            (await fs_1.pathExists(upath_1.join(cwd, 'package-lock.json')))) {
            await fs_1.move(upath_1.join(cwd, 'package-lock.json'), upath_1.join(cwd, 'npm-shrinkwrap.json'));
        }
        // Read the result
        lockFile = await fs_1.readFile(upath_1.join(cwd, filename), 'utf8');
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({
            err,
            type: 'npm',
        }, 'lock file error');
        if ((_c = err.stderr) === null || _c === void 0 ? void 0 : _c.includes('ENOSPC: no space left on device')) {
            throw new Error(error_messages_1.SYSTEM_INSUFFICIENT_DISK_SPACE);
        }
        return { error: true, stderr: err.stderr };
    }
    return { lockFile };
}
exports.generateLockFile = generateLockFile;
//# sourceMappingURL=npm.js.map