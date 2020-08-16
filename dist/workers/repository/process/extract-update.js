"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.lookup = exports.extract = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const object_hash_1 = __importDefault(require("object-hash"));
const logger_1 = require("../../../logger");
const repository_1 = require("../../../util/cache/repository");
const extract_1 = require("../extract");
const branchify_1 = require("../updates/branchify");
const deprecated_1 = require("./deprecated");
const fetch_1 = require("./fetch");
const sort_1 = require("./sort");
const write_1 = require("./write");
// istanbul ignore next
function extractStats(packageFiles) {
    if (!packageFiles) {
        return {};
    }
    const stats = {
        managers: {},
        total: {
            fileCount: 0,
            depCount: 0,
        },
    };
    for (const [manager, managerPackageFiles] of Object.entries(packageFiles)) {
        const fileCount = managerPackageFiles.length;
        let depCount = 0;
        for (const file of managerPackageFiles) {
            depCount += file.deps.length;
        }
        stats.managers[manager] = {
            fileCount,
            depCount,
        };
        stats.total.fileCount += fileCount;
        stats.total.depCount += depCount;
    }
    return stats;
}
async function extract(config) {
    var _a;
    logger_1.logger.debug('extract()');
    const { baseBranch, baseBranchSha } = config;
    let packageFiles;
    const cache = repository_1.getCache();
    const cachedExtract = (_a = cache === null || cache === void 0 ? void 0 : cache.scan) === null || _a === void 0 ? void 0 : _a[baseBranch];
    const configHash = object_hash_1.default(config);
    // istanbul ignore if
    if ((cachedExtract === null || cachedExtract === void 0 ? void 0 : cachedExtract.sha) === baseBranchSha &&
        (cachedExtract === null || cachedExtract === void 0 ? void 0 : cachedExtract.configHash) === configHash) {
        logger_1.logger.debug({ baseBranch, baseBranchSha }, 'Found cached extract');
        packageFiles = cachedExtract.packageFiles;
    }
    else {
        packageFiles = await extract_1.extractAllDependencies(config);
        cache.scan = cache.scan || Object.create({});
        cache.scan[baseBranch] = {
            sha: baseBranchSha,
            configHash,
            packageFiles,
        };
        // Clean up cached branch extracts
        const baseBranches = is_1.default.nonEmptyArray(config.baseBranches)
            ? config.baseBranches
            : [baseBranch];
        Object.keys(cache.scan).forEach((branchName) => {
            if (!baseBranches.includes(branchName)) {
                delete cache.scan[branchName];
            }
        });
    }
    const stats = extractStats(packageFiles);
    logger_1.logger.info({ baseBranch: config.baseBranch, stats }, `Dependency extraction complete`);
    logger_1.logger.trace({ config: packageFiles }, 'packageFiles');
    return packageFiles;
}
exports.extract = extract;
async function lookup(config, packageFiles) {
    await fetch_1.fetchUpdates(config, packageFiles);
    logger_1.logger.debug({ config: packageFiles }, 'packageFiles with updates');
    await deprecated_1.raiseDeprecationWarnings(config, packageFiles);
    const { branches, branchList } = await branchify_1.branchifyUpgrades(config, packageFiles);
    sort_1.sortBranches(branches);
    return { branches, branchList, packageFiles };
}
exports.lookup = lookup;
async function update(config, branches) {
    let res;
    // istanbul ignore else
    if (config.repoIsOnboarded) {
        res = await write_1.writeUpdates(config, branches);
    }
    return res;
}
exports.update = update;
//# sourceMappingURL=extract-update.js.map