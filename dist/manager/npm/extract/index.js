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
exports.extractAllPackageFiles = exports.postExtract = exports.extractPackageFile = void 0;
const path_1 = require("path");
const is_1 = __importDefault(require("@sindresorhus/is"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const error_messages_1 = require("../../../constants/error-messages");
const datasourceGithubTags = __importStar(require("../../../datasource/github-tags"));
const datasourceNpm = __importStar(require("../../../datasource/npm"));
const logger_1 = require("../../../logger");
const types_1 = require("../../../types");
const fs_1 = require("../../../util/fs");
const nodeVersioning = __importStar(require("../../../versioning/node"));
const npm_1 = require("../../../versioning/npm");
const locked_versions_1 = require("./locked-versions");
const monorepo_1 = require("./monorepo");
const type_1 = require("./type");
function parseDepName(depType, key) {
    if (depType !== 'resolutions') {
        return key;
    }
    const [, depName] = /((?:@[^/]+\/)?[^/@]+)$/.exec(key);
    return depName;
}
async function extractPackageFile(content, fileName, config) {
    var _a;
    logger_1.logger.trace(`npm.extractPackageFile(${fileName})`);
    logger_1.logger.trace({ content });
    const deps = [];
    let packageJson;
    try {
        packageJson = JSON.parse(content);
    }
    catch (err) {
        logger_1.logger.debug({ fileName }, 'Invalid JSON');
        return null;
    }
    // eslint-disable-next-line no-underscore-dangle
    if (packageJson._id && packageJson._args && packageJson._from) {
        logger_1.logger.debug('Ignoring vendorised package.json');
        return null;
    }
    if (fileName !== 'package.json' && packageJson.renovate) {
        const error = new Error(error_messages_1.CONFIG_VALIDATION);
        error.configFile = fileName;
        error.validationError =
            'Nested package.json must not contain renovate configuration. Please use `packageRules` with `paths` in your main config instead.';
        throw error;
    }
    const packageJsonName = packageJson.name;
    logger_1.logger.debug(`npm file ${fileName} has name ${JSON.stringify(packageJsonName)}`);
    const packageJsonVersion = packageJson.version;
    let yarnWorkspacesPackages;
    if (is_1.default.array(packageJson.workspaces)) {
        yarnWorkspacesPackages = packageJson.workspaces;
    }
    else {
        yarnWorkspacesPackages = (_a = packageJson.workspaces) === null || _a === void 0 ? void 0 : _a.packages;
    }
    const packageJsonType = type_1.mightBeABrowserLibrary(packageJson)
        ? 'library'
        : 'app';
    const lockFiles = {
        yarnLock: 'yarn.lock',
        packageLock: 'package-lock.json',
        shrinkwrapJson: 'npm-shrinkwrap.json',
        pnpmShrinkwrap: 'pnpm-lock.yaml',
    };
    for (const [key, val] of Object.entries(lockFiles)) {
        const filePath = fs_1.getSiblingFileName(fileName, val);
        if (await fs_1.readLocalFile(filePath, 'utf8')) {
            lockFiles[key] = filePath;
        }
        else {
            lockFiles[key] = undefined;
        }
    }
    lockFiles.npmLock = lockFiles.packageLock || lockFiles.shrinkwrapJson;
    delete lockFiles.packageLock;
    delete lockFiles.shrinkwrapJson;
    let npmrc;
    let ignoreNpmrcFile;
    const npmrcFileName = fs_1.getSiblingFileName(fileName, '.npmrc');
    // istanbul ignore if
    if (config.ignoreNpmrcFile) {
        await fs_1.deleteLocalFile(npmrcFileName);
    }
    else {
        npmrc = await fs_1.readLocalFile(npmrcFileName, 'utf8');
        if (npmrc === null || npmrc === void 0 ? void 0 : npmrc.includes('package-lock')) {
            logger_1.logger.debug('Stripping package-lock setting from npmrc');
            npmrc = npmrc.replace(/(^|\n)package-lock.*?(\n|$)/g, '\n');
        }
        if (npmrc) {
            if (npmrc.includes('=${') && !(global.trustLevel === 'high')) {
                logger_1.logger.debug('Discarding .npmrc file with variables');
                ignoreNpmrcFile = true;
                npmrc = undefined;
                await fs_1.deleteLocalFile(npmrcFileName);
            }
        }
        else {
            npmrc = undefined;
        }
    }
    const yarnrcFileName = fs_1.getSiblingFileName(fileName, '.yarnrc');
    let yarnrc;
    if (!is_1.default.string(config.yarnrc)) {
        yarnrc = (await fs_1.readLocalFile(yarnrcFileName, 'utf8')) || undefined;
    }
    let lernaDir;
    let lernaPackages;
    let lernaClient;
    let hasFileRefs = false;
    let lernaJson;
    try {
        const lernaJsonFileName = fs_1.getSiblingFileName(fileName, 'lerna.json');
        lernaJson = JSON.parse(await fs_1.readLocalFile(lernaJsonFileName, 'utf8'));
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ err }, 'Could not parse lerna.json');
    }
    if (lernaJson) {
        lernaDir = path_1.dirname(fileName);
        lernaPackages = lernaJson.packages;
        lernaClient =
            lernaJson.npmClient === 'yarn' || lockFiles.yarnLock ? 'yarn' : 'npm';
    }
    const depTypes = {
        dependencies: 'dependency',
        devDependencies: 'devDependency',
        optionalDependencies: 'optionalDependency',
        peerDependencies: 'peerDependency',
        engines: 'engine',
        volta: 'volta',
        resolutions: 'resolutions',
    };
    const compatibility = {};
    function extractDependency(depType, depName, input) {
        const dep = {};
        if (!validate_npm_package_name_1.default(depName).validForOldPackages) {
            dep.skipReason = types_1.SkipReason.InvalidName;
            return dep;
        }
        if (typeof input !== 'string') {
            dep.skipReason = types_1.SkipReason.InvalidValue;
            return dep;
        }
        dep.currentValue = input.trim();
        if (depType === 'engines') {
            if (depName === 'node') {
                dep.datasource = datasourceGithubTags.id;
                dep.lookupName = 'nodejs/node';
                dep.versioning = nodeVersioning.id;
                compatibility.node = dep.currentValue;
            }
            else if (depName === 'yarn') {
                dep.datasource = datasourceNpm.id;
                dep.commitMessageTopic = 'Yarn';
                compatibility.yarn = dep.currentValue;
            }
            else if (depName === 'npm') {
                dep.datasource = datasourceNpm.id;
                dep.commitMessageTopic = 'npm';
                compatibility.npm = dep.currentValue;
            }
            else if (depName === 'pnpm') {
                dep.datasource = datasourceNpm.id;
                dep.commitMessageTopic = 'pnpm';
                compatibility.pnpm = dep.currentValue;
            }
            else {
                dep.skipReason = types_1.SkipReason.UnknownEngines;
            }
            if (!npm_1.isValid(dep.currentValue)) {
                dep.skipReason = types_1.SkipReason.UnknownVersion;
            }
            return dep;
        }
        // support for volta
        if (depType === 'volta') {
            if (depName === 'node') {
                dep.datasource = datasourceGithubTags.id;
                dep.lookupName = 'nodejs/node';
                dep.versioning = nodeVersioning.id;
            }
            else if (depName === 'yarn') {
                dep.datasource = datasourceNpm.id;
                dep.commitMessageTopic = 'Yarn';
            }
            else {
                dep.skipReason = types_1.SkipReason.UnknownVolta;
            }
            if (!npm_1.isValid(dep.currentValue)) {
                dep.skipReason = types_1.SkipReason.UnknownVersion;
            }
            return dep;
        }
        if (dep.currentValue.startsWith('npm:')) {
            dep.npmPackageAlias = true;
            const valSplit = dep.currentValue.replace('npm:', '').split('@');
            if (valSplit.length === 2) {
                dep.lookupName = valSplit[0];
                dep.currentValue = valSplit[1];
            }
            else if (valSplit.length === 3) {
                dep.lookupName = valSplit[0] + '@' + valSplit[1];
                dep.currentValue = valSplit[2];
            }
            else {
                logger_1.logger.debug('Invalid npm package alias: ' + dep.currentValue);
            }
        }
        if (dep.currentValue.startsWith('file:')) {
            dep.skipReason = types_1.SkipReason.File;
            hasFileRefs = true;
            return dep;
        }
        if (npm_1.isValid(dep.currentValue)) {
            dep.datasource = datasourceNpm.id;
            if (dep.currentValue === '*') {
                dep.skipReason = types_1.SkipReason.AnyVersion;
            }
            if (dep.currentValue === '') {
                dep.skipReason = types_1.SkipReason.Empty;
            }
            return dep;
        }
        const hashSplit = dep.currentValue.split('#');
        if (hashSplit.length !== 2) {
            dep.skipReason = types_1.SkipReason.UnknownVersion;
            return dep;
        }
        const [depNamePart, depRefPart] = hashSplit;
        const githubOwnerRepo = depNamePart
            .replace(/^github:/, '')
            .replace(/^git\+/, '')
            .replace(/^https:\/\/github\.com\//, '')
            .replace(/\.git$/, '');
        const githubRepoSplit = githubOwnerRepo.split('/');
        if (githubRepoSplit.length !== 2) {
            dep.skipReason = types_1.SkipReason.UnknownVersion;
            return dep;
        }
        const [githubOwner, githubRepo] = githubRepoSplit;
        const githubValidRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/;
        if (!githubValidRegex.test(githubOwner) ||
            !githubValidRegex.test(githubRepo)) {
            dep.skipReason = types_1.SkipReason.UnknownVersion;
            return dep;
        }
        if (npm_1.isVersion(depRefPart)) {
            dep.currentRawValue = dep.currentValue;
            dep.currentValue = depRefPart;
            dep.datasource = datasourceGithubTags.id;
            dep.lookupName = githubOwnerRepo;
            dep.pinDigests = false;
        }
        else if (/^[0-9a-f]{7}$/.test(depRefPart) ||
            /^[0-9a-f]{40}$/.test(depRefPart)) {
            dep.currentRawValue = dep.currentValue;
            dep.currentValue = null;
            dep.currentDigest = depRefPart;
            dep.datasource = datasourceGithubTags.id;
            dep.lookupName = githubOwnerRepo;
        }
        else {
            dep.skipReason = types_1.SkipReason.UnversionedReference;
            return dep;
        }
        dep.githubRepo = githubOwnerRepo;
        dep.sourceUrl = `https://github.com/${githubOwnerRepo}`;
        dep.gitRef = true;
        return dep;
    }
    for (const depType of Object.keys(depTypes)) {
        if (packageJson[depType]) {
            try {
                for (const [key, val] of Object.entries(packageJson[depType])) {
                    const depName = parseDepName(depType, key);
                    const dep = {
                        depType,
                        depName,
                    };
                    if (depName !== key) {
                        dep.managerData = { key };
                    }
                    Object.assign(dep, extractDependency(depType, depName, val));
                    if (depName === 'node') {
                        // This is a special case for Node.js to group it together with other managers
                        dep.commitMessageTopic = 'Node.js';
                        dep.major = { enabled: false };
                    }
                    dep.prettyDepType = depTypes[depType];
                    deps.push(dep);
                }
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ fileName, depType, err }, 'Error parsing package.json');
                return null;
            }
        }
    }
    if (deps.length === 0) {
        logger_1.logger.debug('Package file has no deps');
        if (!(packageJsonName ||
            packageJsonVersion ||
            npmrc ||
            lernaDir ||
            yarnWorkspacesPackages)) {
            logger_1.logger.debug('Skipping file');
            return null;
        }
    }
    let skipInstalls = config.skipInstalls;
    if (skipInstalls === null) {
        if (hasFileRefs) {
            // https://github.com/npm/cli/issues/1432
            // Explanation:
            //  - npm install --package-lock-only is buggy for transitive deps in file: references
            //  - So we set skipInstalls to false if file: refs are found *and* the user hasn't explicitly set the value already
            logger_1.logger.debug('Automatically setting skipInstalls to false');
            skipInstalls = false;
        }
        else {
            skipInstalls = true;
        }
    }
    return {
        deps,
        packageJsonName,
        packageJsonVersion,
        packageJsonType,
        npmrc,
        ignoreNpmrcFile,
        yarnrc,
        ...lockFiles,
        lernaDir,
        lernaClient,
        lernaPackages,
        skipInstalls,
        yarnWorkspacesPackages,
        compatibility,
    };
}
exports.extractPackageFile = extractPackageFile;
async function postExtract(packageFiles) {
    monorepo_1.detectMonorepos(packageFiles);
    await locked_versions_1.getLockedVersions(packageFiles);
}
exports.postExtract = postExtract;
async function extractAllPackageFiles(config, packageFiles) {
    const npmFiles = [];
    for (const packageFile of packageFiles) {
        const content = await fs_1.readLocalFile(packageFile, 'utf8');
        // istanbul ignore else
        if (content) {
            const deps = await extractPackageFile(content, packageFile, config);
            if (deps) {
                npmFiles.push({
                    packageFile,
                    ...deps,
                });
            }
        }
        else {
            logger_1.logger.debug({ packageFile }, 'packageFile has no content');
        }
    }
    await postExtract(npmFiles);
    return npmFiles;
}
exports.extractAllPackageFiles = extractAllPackageFiles;
//# sourceMappingURL=index.js.map