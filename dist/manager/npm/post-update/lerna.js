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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLockFiles = exports.getLernaVersion = void 0;
const semver_1 = __importStar(require("semver"));
const shlex_1 = require("shlex");
const upath_1 = require("upath");
const logger_1 = require("../../../logger");
const exec_1 = require("../../../util/exec");
const node_version_1 = require("./node-version");
const yarn_1 = require("./yarn");
// Exported for testability
function getLernaVersion(lernaPackageFile) {
    var _a;
    const lernaDep = (_a = lernaPackageFile.deps) === null || _a === void 0 ? void 0 : _a.find((d) => d.depName === 'lerna');
    if (!lernaDep || !semver_1.default.validRange(lernaDep.currentValue)) {
        logger_1.logger.warn(`Could not detect lerna version in ${lernaPackageFile.packageFile}, using 'latest'`);
        return 'latest';
    }
    return lernaDep.currentValue;
}
exports.getLernaVersion = getLernaVersion;
async function generateLockFiles(lernaPackageFile, cwd, config, env, skipInstalls) {
    var _a, _b;
    const lernaClient = lernaPackageFile.lernaClient;
    if (!lernaClient) {
        logger_1.logger.warn('No lernaClient specified - returning');
        return { error: false };
    }
    logger_1.logger.debug(`Spawning lerna with ${lernaClient} to create lock files`);
    const preCommands = [];
    const cmd = [];
    let cmdOptions = '';
    try {
        if (lernaClient === 'yarn') {
            let installYarn = 'npm i -g yarn';
            const yarnCompatibility = (_a = config.compatibility) === null || _a === void 0 ? void 0 : _a.yarn;
            if (semver_1.validRange(yarnCompatibility)) {
                installYarn += `@${shlex_1.quote(yarnCompatibility)}`;
            }
            preCommands.push(installYarn);
            if (skipInstalls !== false) {
                preCommands.push(yarn_1.optimizeCommand);
            }
            cmdOptions = '--ignore-scripts --ignore-engines --ignore-platform';
        }
        else if (lernaClient === 'npm') {
            let installNpm = 'npm i -g npm';
            const npmCompatibility = (_b = config.compatibility) === null || _b === void 0 ? void 0 : _b.npm;
            if (semver_1.validRange(npmCompatibility)) {
                installNpm += `@${shlex_1.quote(npmCompatibility)}`;
                preCommands.push(installNpm);
            }
            cmdOptions = '--ignore-scripts  --no-audit';
            if (skipInstalls !== false) {
                cmdOptions += ' --package-lock-only';
            }
        }
        else {
            logger_1.logger.warn({ lernaClient }, 'Unknown lernaClient');
            return { error: false };
        }
        let lernaCommand = `lerna bootstrap --no-ci --ignore-scripts -- `;
        if (global.trustLevel === 'high' && config.ignoreScripts !== false) {
            cmdOptions = cmdOptions.replace('--ignore-scripts ', '');
            lernaCommand = lernaCommand.replace('--ignore-scripts ', '');
        }
        lernaCommand += cmdOptions;
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
        cmd.push(`${lernaClient} install ${cmdOptions}`);
        const lernaVersion = getLernaVersion(lernaPackageFile);
        logger_1.logger.debug('Using lerna version ' + lernaVersion);
        preCommands.push(`npm i -g lerna@${shlex_1.quote(lernaVersion)}`);
        cmd.push(lernaCommand);
        await exec_1.exec(cmd, execOptions);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.debug({
            cmd,
            err,
            type: 'lerna',
            lernaClient,
        }, 'lock file error');
        return { error: true, stderr: err.stderr };
    }
    return { error: false };
}
exports.generateLockFiles = generateLockFiles;
//# sourceMappingURL=lerna.js.map