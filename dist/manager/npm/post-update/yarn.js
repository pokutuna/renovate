"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLockFile = exports.optimizeCommand = exports.hasYarnOfflineMirror = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const semver_1 = require("semver");
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const error_messages_1 = require("../../../constants/error-messages");
const npm_1 = require("../../../datasource/npm");
const logger_1 = require("../../../logger");
const external_host_error_1 = require("../../../types/errors/external-host-error");
const exec_1 = require("../../../util/exec");
const fs_1 = require("../../../util/fs");
const node_version_1 = require("./node-version");
async function hasYarnOfflineMirror(cwd) {
    try {
        const yarnrc = await fs_1.readFile(`${cwd}/.yarnrc`, 'utf8');
        if (is_1.default.string(yarnrc)) {
            const mirrorLine = yarnrc
                .split('\n')
                .find((line) => line.startsWith('yarn-offline-mirror '));
            if (mirrorLine) {
                return true;
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        // not found
    }
    return false;
}
exports.hasYarnOfflineMirror = hasYarnOfflineMirror;
exports.optimizeCommand = "sed -i 's/ steps,/ steps.slice(0,1),/' /home/ubuntu/.npm-global/lib/node_modules/yarn/lib/cli.js";
async function generateLockFile(cwd, env, config = {}, upgrades = []) {
    var _a, _b, _c;
    const lockFileName = upath_1.join(cwd, 'yarn.lock');
    logger_1.logger.debug(`Spawning yarn install to create ${lockFileName}`);
    let lockFile = null;
    try {
        let installYarn = 'npm i -g yarn';
        const yarnCompatibility = (_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.yarn;
        if (semver_1.validRange(yarnCompatibility)) {
            installYarn += `@${shlex_1.quote(yarnCompatibility)}`;
        }
        const preCommands = [installYarn];
        if (config.skipInstalls !== false &&
            (await hasYarnOfflineMirror(cwd)) === false) {
            logger_1.logger.debug('Updating yarn.lock only - skipping node_modules');
            // The following change causes Yarn 1.x to exit gracefully after updating the lock file but without installing node_modules
            preCommands.push(exports.optimizeCommand);
        }
        const commands = [];
        let cmdOptions = '--ignore-engines --ignore-platform --network-timeout 100000';
        if (global.trustLevel !== 'high' || config.ignoreScripts) {
            cmdOptions += ' --ignore-scripts';
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
        // This command updates the lock file based on package.json
        commands.push(`yarn install ${cmdOptions}`.trim());
        // rangeStrategy = update-lockfile
        const lockUpdates = upgrades
            .filter((upgrade) => upgrade.isLockfileUpdate)
            .map((upgrade) => upgrade.depName); // note - this can hit a yarn bug, see https://github.com/yarnpkg/yarn/issues/8236
        if (lockUpdates.length) {
            logger_1.logger.debug('Performing lockfileUpdate (yarn)');
            commands.push(`yarn upgrade ${lockUpdates.join(' ')} ${cmdOptions}`.trim());
        }
        // postUpdateOptions
        if ((_b = config.postUpdateOptions) === null || _b === void 0 ? void 0 : _b.includes('yarnDedupeFewer')) {
            logger_1.logger.debug('Performing yarn dedupe fewer');
            commands.push('npx yarn-deduplicate --strategy fewer');
            // Run yarn again in case any changes are necessary
            commands.push(`yarn install ${cmdOptions}`.trim());
        }
        if ((_c = config.postUpdateOptions) === null || _c === void 0 ? void 0 : _c.includes('yarnDedupeHighest')) {
            logger_1.logger.debug('Performing yarn dedupe highest');
            commands.push('npx yarn-deduplicate --strategy highest');
            // Run yarn again in case any changes are necessary
            commands.push(`yarn install ${cmdOptions}`.trim());
        }
        if (upgrades.find((upgrade) => upgrade.isLockFileMaintenance)) {
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
        // Read the result
        lockFile = await fs_1.readFile(lockFileName, 'utf8');
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({
            err,
            type: 'yarn',
        }, 'lock file error');
        if (err.stderr) {
            if (err.stderr.includes('ENOSPC: no space left on device')) {
                throw new Error(error_messages_1.SYSTEM_INSUFFICIENT_DISK_SPACE);
            }
            if (err.stderr.includes('The registry may be down.') ||
                err.stderr.includes('getaddrinfo ENOTFOUND registry.yarnpkg.com') ||
                err.stderr.includes('getaddrinfo ENOTFOUND registry.npmjs.org')) {
                throw new external_host_error_1.ExternalHostError(err, npm_1.id);
            }
        }
        return { error: true, stderr: err.stderr };
    }
    return { lockFile };
}
exports.generateLockFile = generateLockFile;
//# sourceMappingURL=yarn.js.map