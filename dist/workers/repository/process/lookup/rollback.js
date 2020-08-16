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
exports.getRollbackUpdate = void 0;
const logger_1 = require("../../../../logger");
const allVersioning = __importStar(require("../../../../versioning"));
function getRollbackUpdate(config, versions) {
    const { packageFile, versioning, depName, currentValue } = config;
    const version = allVersioning.get(versioning);
    // istanbul ignore if
    if (!('isLessThanRange' in version)) {
        logger_1.logger.debug({ versioning }, 'Current versioning does not support isLessThanRange()');
        return null;
    }
    const lessThanVersions = versions.filter((v) => version.isLessThanRange(v, currentValue));
    // istanbul ignore if
    if (!lessThanVersions.length) {
        logger_1.logger.debug({ packageFile, depName, currentValue }, 'Missing version has nothing to roll back to');
        return null;
    }
    logger_1.logger.debug({ packageFile, depName, currentValue }, `Current version not found - rolling back`);
    logger_1.logger.debug({ dependency: depName, versions }, 'Versions found before rolling back');
    lessThanVersions.sort((a, b) => version.sortVersions(a, b));
    const toVersion = lessThanVersions.pop();
    // istanbul ignore if
    if (!toVersion) {
        logger_1.logger.debug('No toVersion to roll back to');
        return null;
    }
    const newValue = version.getNewValue({
        currentValue,
        rangeStrategy: 'replace',
        toVersion,
    });
    return {
        updateType: 'rollback',
        branchName: '{{{branchPrefix}}}rollback-{{{depNameSanitized}}}-{{{newMajor}}}.x',
        commitMessageAction: 'Roll back',
        isRollback: true,
        newValue,
        newMajor: version.getMajor(toVersion),
        semanticCommitType: 'fix',
    };
}
exports.getRollbackUpdate = getRollbackUpdate;
//# sourceMappingURL=rollback.js.map