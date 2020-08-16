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
exports.updateArtifacts = void 0;
const shlex_1 = require("shlex");
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const memCache = __importStar(require("../../util/cache/memory"));
const exec_1 = require("../../util/exec");
const fs_1 = require("../../util/fs");
const git_1 = require("../../util/git");
const ruby_1 = require("../../versioning/ruby");
const host_rules_1 = require("./host-rules");
const utils_1 = require("./utils");
const hostConfigVariablePrefix = 'BUNDLE_';
async function getRubyConstraint(updateArtifact) {
    const { packageFileName, config } = updateArtifact;
    const { compatibility = {} } = config;
    const { ruby } = compatibility;
    let rubyConstraint;
    if (ruby) {
        logger_1.logger.debug('Using rubyConstraint from config');
        rubyConstraint = ruby;
    }
    else {
        const rubyVersionFile = fs_1.getSiblingFileName(packageFileName, '.ruby-version');
        const rubyVersionFileContent = await fs_1.readLocalFile(rubyVersionFile, 'utf8');
        if (rubyVersionFileContent) {
            logger_1.logger.debug('Using ruby version specified in .ruby-version');
            rubyConstraint = rubyVersionFileContent
                .replace(/^ruby-/, '')
                .replace(/\n/g, '')
                .trim();
        }
    }
    return rubyConstraint;
}
function buildBundleHostVariable(hostRule) {
    const varName = hostConfigVariablePrefix +
        host_rules_1.getDomain(hostRule)
            .split('.')
            .map((term) => term.toUpperCase())
            .join('__');
    return {
        [varName]: `${host_rules_1.getAuthenticationHeaderValue(hostRule)}`,
    };
}
async function updateArtifacts(updateArtifact) {
    var _a, _b, _c;
    const { packageFileName, updatedDeps, newPackageFileContent, config, } = updateArtifact;
    const { compatibility = {} } = config;
    logger_1.logger.debug(`bundler.updateArtifacts(${packageFileName})`);
    const existingError = memCache.get('bundlerArtifactsError');
    // istanbul ignore if
    if (existingError) {
        logger_1.logger.debug('Aborting Bundler artifacts due to previous failed attempt');
        throw new Error(existingError);
    }
    const lockFileName = `${packageFileName}.lock`;
    const existingLockFileContent = await fs_1.readLocalFile(lockFileName, 'utf8');
    if (!existingLockFileContent) {
        logger_1.logger.debug('No Gemfile.lock found');
        return null;
    }
    if (config.isLockFileMaintenance) {
        await fs_1.deleteLocalFile(lockFileName);
    }
    try {
        await fs_1.writeLocalFile(packageFileName, newPackageFileContent);
        let cmd;
        if (config.isLockFileMaintenance) {
            cmd = 'bundle lock';
        }
        else {
            cmd = `bundle lock --update ${updatedDeps.map(shlex_1.quote).join(' ')}`;
        }
        let bundlerVersion = '';
        const { bundler } = compatibility;
        if (bundler) {
            if (ruby_1.isValid(bundler)) {
                logger_1.logger.debug({ bundlerVersion: bundler }, 'Found bundler version');
                bundlerVersion = ` -v ${shlex_1.quote(bundler)}`;
            }
            else {
                logger_1.logger.warn({ bundlerVersion: bundler }, 'Invalid bundler version');
            }
        }
        else {
            logger_1.logger.debug('No bundler version constraint found - will use latest');
        }
        const preCommands = [
            'ruby --version',
            `gem install bundler${bundlerVersion}`,
        ];
        const bundlerHostRulesVariables = host_rules_1.findAllAuthenticatable({
            hostType: 'bundler',
        }).reduce((variables, hostRule) => {
            return { ...variables, ...buildBundleHostVariable(hostRule) };
        }, {});
        const execOptions = {
            cwdFile: packageFileName,
            extraEnv: {
                ...bundlerHostRulesVariables,
                GEM_HOME: await utils_1.getGemHome(config),
            },
            docker: {
                image: 'renovate/ruby',
                tagScheme: 'ruby',
                tagConstraint: await getRubyConstraint(updateArtifact),
                preCommands,
            },
        };
        await exec_1.exec(cmd, execOptions);
        const status = await git_1.getRepoStatus();
        if (!status.modified.includes(lockFileName)) {
            return null;
        }
        logger_1.logger.debug('Returning updated Gemfile.lock');
        const lockFileContent = await fs_1.readLocalFile(lockFileName);
        return [
            {
                file: {
                    name: lockFileName,
                    contents: lockFileContent,
                },
            },
        ];
    }
    catch (err) /* istanbul ignore next */ {
        const output = `${err.stdout}\n${err.stderr}`;
        if (err.message.includes('fatal: Could not parse object') ||
            output.includes('but that version could not be found')) {
            return [
                {
                    artifactError: {
                        lockFile: lockFileName,
                        stderr: output,
                    },
                },
            ];
        }
        if (((_a = err.stdout) === null || _a === void 0 ? void 0 : _a.includes('Please supply credentials for this source')) || ((_b = err.stderr) === null || _b === void 0 ? void 0 : _b.includes('Authentication is required')) || ((_c = err.stderr) === null || _c === void 0 ? void 0 : _c.includes('Please make sure you have the correct access rights'))) {
            logger_1.logger.debug({ err }, 'Gemfile.lock update failed due to missing credentials - skipping branch');
            // Do not generate these PRs because we don't yet support Bundler authentication
            memCache.set('bundlerArtifactsError', error_messages_1.BUNDLER_INVALID_CREDENTIALS);
            throw new Error(error_messages_1.BUNDLER_INVALID_CREDENTIALS);
        }
        const resolveMatchRe = new RegExp('\\s+(.*) was resolved to', 'g');
        if (output.match(resolveMatchRe) && !config.isLockFileMaintenance) {
            logger_1.logger.debug({ err }, 'Bundler has a resolve error');
            const resolveMatches = [];
            let resolveMatch;
            do {
                resolveMatch = resolveMatchRe.exec(output);
                if (resolveMatch) {
                    resolveMatches.push(resolveMatch[1].split(' ').shift());
                }
            } while (resolveMatch);
            if (resolveMatches.some((match) => !updatedDeps.includes(match))) {
                logger_1.logger.debug({ resolveMatches, updatedDeps }, 'Found new resolve matches - reattempting recursively');
                const newUpdatedDeps = [
                    ...new Set([...updatedDeps, ...resolveMatches]),
                ];
                return updateArtifacts({
                    packageFileName,
                    updatedDeps: newUpdatedDeps,
                    newPackageFileContent,
                    config,
                });
            }
            logger_1.logger.debug({ err }, 'Gemfile.lock update failed due to incompatible packages');
        }
        else {
            logger_1.logger.info({ err }, 'Gemfile.lock update failed due to an unknown reason');
        }
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