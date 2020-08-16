"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMonorepos = void 0;
const path_1 = __importDefault(require("path"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const minimatch_1 = __importDefault(require("minimatch"));
const upath_1 = __importDefault(require("upath"));
const logger_1 = require("../../../logger");
const types_1 = require("../../../types");
function matchesAnyPattern(val, patterns) {
    const res = patterns.some((pattern) => pattern === val + '/' || minimatch_1.default(val, pattern, { dot: true }));
    logger_1.logger.trace({ val, patterns, res }, `matchesAnyPattern`);
    return res;
}
function detectMonorepos(packageFiles) {
    var _a, _b;
    logger_1.logger.debug('Detecting Lerna and Yarn Workspaces');
    for (const p of packageFiles) {
        const { packageFile, npmLock, yarnLock, lernaDir, lernaClient, lernaPackages, yarnWorkspacesPackages, } = p;
        const basePath = path_1.default.dirname(packageFile);
        const packages = yarnWorkspacesPackages || lernaPackages;
        if (packages === null || packages === void 0 ? void 0 : packages.length) {
            logger_1.logger.debug({ packageFile, yarnWorkspacesPackages, lernaPackages }, 'Found monorepo packages with base path ' + JSON.stringify(basePath));
            const internalPackagePatterns = (is_1.default.array(packages)
                ? packages
                : [packages]).map((pattern) => upath_1.default.join(basePath, pattern));
            const internalPackageFiles = packageFiles.filter((sp) => matchesAnyPattern(path_1.default.dirname(sp.packageFile), internalPackagePatterns));
            const internalPackageNames = internalPackageFiles
                .map((sp) => sp.packageJsonName)
                .filter(Boolean);
            (_a = p.deps) === null || _a === void 0 ? void 0 : _a.forEach((dep) => {
                if (internalPackageNames.includes(dep.depName)) {
                    dep.skipReason = types_1.SkipReason.InternalPackage; // eslint-disable-line no-param-reassign
                }
            });
            for (const subPackage of internalPackageFiles) {
                subPackage.lernaDir = lernaDir;
                subPackage.lernaClient = lernaClient;
                subPackage.yarnLock = subPackage.yarnLock || yarnLock;
                subPackage.npmLock = subPackage.npmLock || npmLock;
                if (subPackage.yarnLock) {
                    subPackage.hasYarnWorkspaces = !!yarnWorkspacesPackages;
                }
                (_b = subPackage.deps) === null || _b === void 0 ? void 0 : _b.forEach((dep) => {
                    if (internalPackageNames.includes(dep.depName)) {
                        dep.skipReason = types_1.SkipReason.InternalPackage; // eslint-disable-line no-param-reassign
                    }
                });
            }
        }
    }
}
exports.detectMonorepos = detectMonorepos;
//# sourceMappingURL=monorepo.js.map