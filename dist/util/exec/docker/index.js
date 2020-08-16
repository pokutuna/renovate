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
exports.generateDockerCommand = exports.removeDanglingContainers = exports.removeDockerContainer = exports.resetPrefetchedImages = void 0;
const error_messages_1 = require("../../../constants/error-messages");
const datasource_1 = require("../../../datasource");
const logger_1 = require("../../../logger");
const versioning = __importStar(require("../../../versioning"));
const common_1 = require("../common");
const prefetchedImages = new Set();
async function prefetchDockerImage(taggedImage) {
    if (prefetchedImages.has(taggedImage)) {
        logger_1.logger.debug(`Docker image is already prefetched: ${taggedImage}`);
    }
    else {
        logger_1.logger.debug(`Fetching Docker image: ${taggedImage}`);
        prefetchedImages.add(taggedImage);
        await common_1.rawExec(`docker pull ${taggedImage}`, { encoding: 'utf-8' });
        logger_1.logger.debug(`Finished fetching Docker image`);
    }
}
function resetPrefetchedImages() {
    prefetchedImages.clear();
}
exports.resetPrefetchedImages = resetPrefetchedImages;
function expandVolumeOption(x) {
    if (typeof x === 'string') {
        return [x, x];
    }
    if (Array.isArray(x) && x.length === 2) {
        const [from, to] = x;
        if (typeof from === 'string' && typeof to === 'string') {
            return [from, to];
        }
    }
    return null;
}
function volumesEql(x, y) {
    const [xFrom, xTo] = x;
    const [yFrom, yTo] = y;
    return xFrom === yFrom && xTo === yTo;
}
function uniq(array, eql = (x, y) => x === y) {
    return array.filter((x, idx, arr) => {
        return arr.findIndex((y) => eql(x, y)) === idx;
    });
}
function prepareVolumes(volumes = []) {
    const expanded = volumes.map(expandVolumeOption);
    const filtered = expanded.filter((vol) => vol !== null);
    const unique = uniq(filtered, volumesEql);
    return unique.map(([from, to]) => {
        return `-v "${from}":"${to}"`;
    });
}
function prepareCommands(commands) {
    return commands.filter((command) => command && typeof command === 'string');
}
async function getDockerTag(depName, constraint, scheme) {
    // TODO: fixme
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { isValid, isVersion, matches, sortVersions } = versioning.get(scheme);
    if (!isValid(constraint)) {
        logger_1.logger.warn({ constraint }, `Invalid ${scheme} version constraint`);
        return 'latest';
    }
    logger_1.logger.debug({ constraint }, `Found ${scheme} version constraint - checking for a compatible ${depName} image to use`);
    const imageReleases = await datasource_1.getPkgReleases({ datasource: 'docker', depName });
    if (imageReleases === null || imageReleases === void 0 ? void 0 : imageReleases.releases) {
        let versions = imageReleases.releases.map((release) => release.version);
        versions = versions.filter((version) => isVersion(version) && matches(version, constraint));
        versions = versions.sort(sortVersions);
        if (versions.length) {
            const version = versions.pop();
            logger_1.logger.debug({ constraint, version }, `Found compatible ${scheme} version`);
            return version;
        }
    } /* istanbul ignore next */
    else {
        logger_1.logger.error(`No ${depName} releases found`);
        return 'latest';
    }
    logger_1.logger.warn({ depName, constraint, scheme }, 'Failed to find a tag satisfying constraint, using "latest" tag instead');
    return 'latest';
}
function getContainerName(image) {
    return image.replace(/\//g, '_');
}
async function removeDockerContainer(image) {
    var _a;
    const containerName = getContainerName(image);
    let cmd = `docker ps --filter name=${containerName} -aq`;
    try {
        const res = await common_1.rawExec(cmd, {
            encoding: 'utf-8',
        });
        const containerId = ((_a = res === null || res === void 0 ? void 0 : res.stdout) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        // istanbul ignore if
        if (containerId.length) {
            logger_1.logger.debug({ containerId }, 'Removing container');
            cmd = `docker rm -f ${containerId}`;
            await common_1.rawExec(cmd, {
                encoding: 'utf-8',
            });
        }
        else {
            logger_1.logger.trace({ image, containerName }, 'No running containers to remove');
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.trace({ err }, 'removeDockerContainer err');
        logger_1.logger.info({ image, containerName, cmd }, 'Could not remove Docker container');
    }
}
exports.removeDockerContainer = removeDockerContainer;
// istanbul ignore next
async function removeDanglingContainers() {
    var _a, _b;
    try {
        const res = await common_1.rawExec(`docker ps --filter label=renovate_child -aq`, {
            encoding: 'utf-8',
        });
        if ((_a = res === null || res === void 0 ? void 0 : res.stdout) === null || _a === void 0 ? void 0 : _a.trim().length) {
            const containerIds = res.stdout
                .trim()
                .split('\n')
                .map((container) => container.trim())
                .filter(Boolean);
            logger_1.logger.debug({ containerIds }, 'Removing dangling child containers');
            await common_1.rawExec(`docker rm -f ${containerIds.join(' ')}`, {
                encoding: 'utf-8',
            });
        }
        else {
            logger_1.logger.debug('No dangling containers to remove');
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err.errno === 'ENOMEM') {
            throw new Error(error_messages_1.SYSTEM_INSUFFICIENT_MEMORY);
        }
        if ((_b = err.stderr) === null || _b === void 0 ? void 0 : _b.includes('Cannot connect to the Docker daemon')) {
            logger_1.logger.info('No docker daemon found');
        }
        else {
            logger_1.logger.warn({ err }, 'Error removing dangling containers');
        }
    }
}
exports.removeDanglingContainers = removeDanglingContainers;
async function generateDockerCommand(commands, options, config) {
    const { image, envVars, cwd, tagScheme, tagConstraint } = options;
    const volumes = options.volumes || [];
    const preCommands = options.preCommands || [];
    const postCommands = options.postCommands || [];
    const { localDir, cacheDir, dockerUser } = config;
    const result = ['docker run --rm'];
    const containerName = getContainerName(image);
    result.push(`--name=${containerName}`);
    result.push(`--label=renovate_child`);
    if (dockerUser) {
        result.push(`--user=${dockerUser}`);
    }
    result.push(...prepareVolumes([localDir, cacheDir, ...volumes]));
    if (envVars) {
        result.push(...uniq(envVars)
            .filter((x) => typeof x === 'string')
            .map((e) => `-e ${e}`));
    }
    if (cwd) {
        result.push(`-w "${cwd}"`);
    }
    let tag;
    if (options.tag) {
        tag = options.tag;
    }
    else if (tagConstraint) {
        const tagVersioning = tagScheme || 'semver';
        tag = await getDockerTag(image, tagConstraint, tagVersioning);
        logger_1.logger.debug({ image, tagConstraint, tagVersioning, tag }, 'Resolved tag constraint');
    }
    else {
        logger_1.logger.debug({ image }, 'No tag or tagConstraint specified');
    }
    const taggedImage = tag ? `${image}:${tag}` : `${image}`;
    await prefetchDockerImage(taggedImage);
    result.push(taggedImage);
    const bashCommand = [
        ...prepareCommands(preCommands),
        ...commands,
        ...prepareCommands(postCommands),
    ].join(' && ');
    result.push(`bash -l -c "${bashCommand.replace(/"/g, '\\"')}"`); // lgtm [js/incomplete-sanitization]
    return result.join(' ');
}
exports.generateDockerCommand = generateDockerCommand;
//# sourceMappingURL=index.js.map