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
exports.compile = exports.allowedFields = exports.exposedConfigOptions = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const handlebars = __importStar(require("handlebars"));
const logger_1 = require("../../logger");
const clone_1 = require("../clone");
handlebars.registerHelper('encodeURIComponent', encodeURIComponent);
// istanbul ignore next
handlebars.registerHelper('replace', (find, replace, context) => {
    return context.replace(new RegExp(find, 'g'), replace);
});
exports.exposedConfigOptions = [
    'branchName',
    'branchPrefix',
    'branchTopic',
    'commitMessage',
    'commitMessageAction',
    'commitMessageExtra',
    'commitMessagePrefix',
    'commitMessageSuffix',
    'commitMessageTopic',
    'group',
    'groupSlug',
    'groupName',
    'managerBranchPrefix',
    'prBodyColumns',
    'prBodyDefinitions',
    'prBodyNotes',
    'prTitle',
];
exports.allowedFields = {
    baseDir: 'The full directory with path that the dependency has been found in',
    body: 'The body of the release notes',
    currentValue: 'The extracted current value of the dependency being updated',
    currentVersion: 'The current version that is being updated',
    datasource: 'The datasource used to look up the upgrade',
    depName: 'The name of the dependency being updated',
    depNameLinked: 'The dependency name already linked to its home page using markdown',
    depNameSanitized: 'The depName field sanitized for use in branches after removing spaces and special characters',
    depNameShort: 'Shortened depName',
    depType: 'The dependency type (if extracted - manager-dependent)',
    displayFrom: 'The current value, formatted for display',
    displayTo: 'The to value, formatted for display',
    fromVersion: 'The version that would be currently installed. For example, if currentValue is ^3.0.0 then currentVersion might be 3.1.0.',
    hasReleaseNotes: 'true if the upgrade has release notes',
    isLockfileUpdate: 'true if the branch is a lock file update',
    isMajor: 'true if the upgrade is major',
    isPatch: 'true if the upgrade is a patch upgrade',
    isRange: 'true if the new value is a range',
    isSingleVersion: 'true if the upgrade is to a single version rather than a range',
    logJSON: 'ChangeLogResult object for the upgrade',
    lookupName: 'The full name that was used to look up the dependency.',
    newDigest: 'The new digest value',
    newDigestShort: 'A shorted version of newDigest, for use when the full digest is too long to be conveniently displayed',
    newMajor: 'The major version of the new version. e.g. "3" if the new version if "3.1.0"',
    newMinor: 'The minor version of the new version. e.g. "1" if the new version if "3.1.0"',
    newValue: 'The new value in the upgrade. Can be a range or version e.g. "^3.0.0" or "3.1.0"',
    newVersion: 'The new version in the upgrade.',
    packageFile: 'The filename that the dependency was found in',
    parentDir: 'The name of the directory that the dependency was found in, without full path',
    platform: 'VCS platform in use, e.g. "github", "gitlab", etc.',
    project: 'ChangeLogProject object',
    recreateClosed: 'If true, this PR will be recreated if closed',
    references: 'A list of references for the upgrade',
    releases: 'An array of releases for an upgrade',
    releaseNotes: 'A ChangeLogNotes object for the release',
    repository: 'The current repository',
    toVersion: 'The new version in the upgrade, e.g. "3.1.0"',
    updateType: 'One of digest, pin, rollback, patch, minor, major',
    upgrades: 'An array of upgrade objects in the branch',
    url: 'The url of the release notes',
    version: 'The version number of the changelog',
    versions: 'An array of ChangeLogRelease objects in the upgrade',
};
function getFilteredObject(input) {
    const obj = clone_1.clone(input);
    const res = {};
    const allAllowed = [
        ...Object.keys(exports.allowedFields),
        ...exports.exposedConfigOptions,
    ].sort();
    for (const field of allAllowed) {
        const value = obj[field];
        if (is_1.default.array(value)) {
            res[field] = value.map((element) => getFilteredObject(element));
        }
        else if (is_1.default.object(value)) {
            res[field] = getFilteredObject(value);
        }
        else if (!is_1.default.undefined(value)) {
            res[field] = value;
        }
    }
    return res;
}
function compile(template, input, filterFields = true) {
    const filteredInput = filterFields ? getFilteredObject(input) : input;
    logger_1.logger.trace({ template, filteredInput }, 'Compiling template');
    return handlebars.compile(template)(input);
}
exports.compile = compile;
//# sourceMappingURL=index.js.map