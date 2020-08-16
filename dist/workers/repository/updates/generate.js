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
exports.generateBranchConfig = void 0;
const luxon_1 = require("luxon");
const markdown_table_1 = __importDefault(require("markdown-table"));
const semver_1 = __importDefault(require("semver"));
const config_1 = require("../../../config");
const error_messages_1 = require("../../../constants/error-messages");
const logger_1 = require("../../../logger");
const sanitize_1 = require("../../../util/sanitize");
const template = __importStar(require("../../../util/template"));
function isTypesGroup(branchUpgrades) {
    return (branchUpgrades.some(({ depName }) => depName === null || depName === void 0 ? void 0 : depName.startsWith('@types/')) &&
        new Set(branchUpgrades.map(({ depName }) => depName === null || depName === void 0 ? void 0 : depName.replace(/^@types\//, ''))).size === 1);
}
function sortTypesGroup(upgrades) {
    const isTypesUpgrade = ({ depName }) => depName === null || depName === void 0 ? void 0 : depName.startsWith('@types/');
    const regularUpgrades = upgrades.filter((upgrade) => !isTypesUpgrade(upgrade));
    const typesUpgrades = upgrades.filter(isTypesUpgrade);
    upgrades.splice(0, upgrades.length);
    upgrades.push(...regularUpgrades, ...typesUpgrades);
}
function getTableValues(upgrade) {
    if (!upgrade.commitBodyTable) {
        return null;
    }
    const { datasource, lookupName, depName, fromVersion, toVersion, displayFrom, displayTo, } = upgrade;
    const name = lookupName || depName;
    const from = fromVersion || displayFrom;
    const to = toVersion || displayTo;
    if (datasource && name && from && to) {
        return [datasource, name, from, to];
    }
    logger_1.logger.debug({
        datasource,
        lookupName,
        depName,
        fromVersion,
        toVersion,
        displayFrom,
        displayTo,
    }, 'Cannot determine table values');
    return null;
}
function generateBranchConfig(branchUpgrades) {
    var _a;
    logger_1.logger.trace({ config: branchUpgrades }, 'generateBranchConfig');
    let config = {
        upgrades: [],
    };
    const hasGroupName = branchUpgrades[0].groupName !== null;
    logger_1.logger.trace(`hasGroupName: ${hasGroupName}`);
    // Use group settings only if multiple upgrades or lazy grouping is disabled
    const depNames = [];
    const newValue = [];
    const toVersions = [];
    branchUpgrades.forEach((upg) => {
        if (!depNames.includes(upg.depName)) {
            depNames.push(upg.depName);
        }
        if (!toVersions.includes(upg.toVersion)) {
            toVersions.push(upg.toVersion);
        }
        if (upg.commitMessageExtra) {
            const extra = template.compile(upg.commitMessageExtra, upg);
            if (!newValue.includes(extra)) {
                newValue.push(extra);
            }
        }
    });
    const groupEligible = depNames.length > 1 ||
        toVersions.length > 1 ||
        (!toVersions[0] && newValue.length > 1) ||
        branchUpgrades[0].lazyGrouping === false;
    if (newValue.length > 1 && !groupEligible) {
        // eslint-disable-next-line no-param-reassign
        branchUpgrades[0].commitMessageExtra = `to v${toVersions[0]}`;
    }
    const typesGroup = depNames.length > 1 && !hasGroupName && isTypesGroup(branchUpgrades);
    logger_1.logger.trace(`groupEligible: ${groupEligible}`);
    const useGroupSettings = hasGroupName && groupEligible;
    logger_1.logger.trace(`useGroupSettings: ${useGroupSettings}`);
    let releaseTimestamp;
    for (const branchUpgrade of branchUpgrades) {
        let upgrade = { ...branchUpgrade };
        if (upgrade.currentDigest) {
            upgrade.currentDigestShort =
                upgrade.currentDigestShort ||
                    upgrade.currentDigest.replace('sha256:', '').substring(0, 7);
        }
        if (upgrade.newDigest) {
            upgrade.newDigestShort =
                upgrade.newDigestShort ||
                    upgrade.newDigest.replace('sha256:', '').substring(0, 7);
        }
        if (!upgrade.displayFrom) {
            if (upgrade.currentValue === upgrade.newValue) {
                upgrade.displayFrom =
                    upgrade.currentDigestShort || upgrade.currentVersion || '';
                upgrade.displayTo =
                    upgrade.displayTo ||
                        upgrade.newDigestShort ||
                        upgrade.newVersion ||
                        '';
            }
            else {
                upgrade.displayFrom =
                    upgrade.currentValue ||
                        upgrade.currentVersion ||
                        upgrade.currentDigestShort ||
                        '';
                upgrade.displayTo =
                    upgrade.displayTo ||
                        upgrade.newValue ||
                        upgrade.newVersion ||
                        upgrade.newDigestShort ||
                        '';
            }
        }
        if (upgrade.updateType !== 'lockFileMaintenance' &&
            upgrade.displayFrom.length * upgrade.displayTo.length === 0) {
            logger_1.logger.debug({ config: upgrade }, 'empty displayFrom/displayTo');
        }
        upgrade.prettyDepType =
            upgrade.prettyDepType || upgrade.depType || 'dependency';
        if (useGroupSettings) {
            // Now overwrite original config with group config
            upgrade = config_1.mergeChildConfig(upgrade, upgrade.group);
            upgrade.isGroup = true;
        }
        else {
            delete upgrade.groupName;
        }
        // Delete group config regardless of whether it was applied
        delete upgrade.group;
        delete upgrade.lazyGrouping;
        // istanbul ignore else
        if (toVersions.length > 1 && !typesGroup) {
            logger_1.logger.trace({ toVersions });
            delete upgrade.commitMessageExtra;
            upgrade.recreateClosed = true;
        }
        else if (newValue.length > 1 && upgrade.isDigest) {
            logger_1.logger.trace({ newValue });
            delete upgrade.commitMessageExtra;
            upgrade.recreateClosed = true;
        }
        else if (semver_1.default.valid(toVersions[0])) {
            upgrade.isRange = false;
        }
        // Use templates to generate strings
        logger_1.logger.trace('Compiling branchName: ' + upgrade.branchName);
        upgrade.branchName = template.compile(upgrade.branchName, upgrade);
        if (upgrade.semanticCommits && !upgrade.commitMessagePrefix) {
            logger_1.logger.trace('Upgrade has semantic commits enabled');
            let semanticPrefix = upgrade.semanticCommitType;
            if (upgrade.semanticCommitScope) {
                semanticPrefix += `(${template.compile(upgrade.semanticCommitScope, upgrade)})`;
            }
            upgrade.commitMessagePrefix = semanticPrefix;
            upgrade.commitMessagePrefix += semanticPrefix.endsWith(':') ? ' ' : ': ';
            upgrade.toLowerCase =
                // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
                upgrade.semanticCommitType.match(/[A-Z]/) === null &&
                    !upgrade.semanticCommitType.startsWith(':');
        }
        // Compile a few times in case there are nested templates
        upgrade.commitMessage = template.compile(upgrade.commitMessage || '', upgrade);
        upgrade.commitMessage = template.compile(upgrade.commitMessage, upgrade);
        upgrade.commitMessage = template.compile(upgrade.commitMessage, upgrade);
        // istanbul ignore if
        if (upgrade.commitMessage !== sanitize_1.sanitize(upgrade.commitMessage)) {
            throw new Error(error_messages_1.CONFIG_SECRETS_EXPOSED);
        }
        upgrade.commitMessage = upgrade.commitMessage.trim(); // Trim exterior whitespace
        upgrade.commitMessage = upgrade.commitMessage.replace(/\s+/g, ' '); // Trim extra whitespace inside string
        upgrade.commitMessage = upgrade.commitMessage.replace(/to vv(\d)/, 'to v$1');
        if (upgrade.toLowerCase) {
            // We only need to lowercvase the first line
            const splitMessage = upgrade.commitMessage.split('\n');
            splitMessage[0] = splitMessage[0].toLowerCase();
            upgrade.commitMessage = splitMessage.join('\n');
        }
        if (upgrade.commitBody) {
            upgrade.commitMessage = `${upgrade.commitMessage}\n\n${template.compile(upgrade.commitBody, upgrade)}`;
        }
        logger_1.logger.trace(`commitMessage: ` + JSON.stringify(upgrade.commitMessage));
        if (upgrade.prTitle) {
            upgrade.prTitle = template.compile(upgrade.prTitle, upgrade);
            upgrade.prTitle = template.compile(upgrade.prTitle, upgrade);
            upgrade.prTitle = template
                .compile(upgrade.prTitle, upgrade)
                .trim()
                .replace(/\s+/g, ' ');
            // istanbul ignore if
            if (upgrade.prTitle !== sanitize_1.sanitize(upgrade.prTitle)) {
                throw new Error(error_messages_1.CONFIG_SECRETS_EXPOSED);
            }
            if (upgrade.toLowerCase) {
                upgrade.prTitle = upgrade.prTitle.toLowerCase();
            }
        }
        else {
            [upgrade.prTitle] = upgrade.commitMessage.split('\n');
        }
        upgrade.prTitle += upgrade.hasBaseBranches ? ' ({{baseBranch}})' : '';
        if (upgrade.isGroup) {
            upgrade.prTitle +=
                upgrade.updateType === 'major' && upgrade.separateMajorMinor
                    ? ' (major)'
                    : '';
            upgrade.prTitle +=
                upgrade.updateType === 'minor' && upgrade.separateMinorPatch
                    ? ' (minor)'
                    : '';
            upgrade.prTitle += upgrade.updateType === 'patch' ? ' (patch)' : '';
        }
        // Compile again to allow for nested templates
        upgrade.prTitle = template.compile(upgrade.prTitle, upgrade);
        logger_1.logger.trace(`prTitle: ` + JSON.stringify(upgrade.prTitle));
        config.upgrades.push(upgrade);
        if (upgrade.releaseTimestamp) {
            if (releaseTimestamp) {
                const existingStamp = luxon_1.DateTime.fromISO(releaseTimestamp);
                const upgradeStamp = luxon_1.DateTime.fromISO(upgrade.releaseTimestamp);
                if (upgradeStamp > existingStamp) {
                    releaseTimestamp = upgrade.releaseTimestamp; // eslint-disable-line
                }
            }
            else {
                releaseTimestamp = upgrade.releaseTimestamp; // eslint-disable-line
            }
        }
    }
    if (typesGroup) {
        if ((_a = config.upgrades[0].depName) === null || _a === void 0 ? void 0 : _a.startsWith('@types/')) {
            logger_1.logger.debug('Found @types - reversing upgrades to use depName in PR');
            sortTypesGroup(config.upgrades);
            config.upgrades[0].recreateClosed = false;
            config.hasTypes = true;
        }
    }
    else {
        config.upgrades.sort((a, b) => {
            if (a.fileReplacePosition && b.fileReplacePosition) {
                // This is because we need to replace from the bottom of the file up
                return a.fileReplacePosition > b.fileReplacePosition ? -1 : 1;
            }
            if (a.depName < b.depName) {
                return -1;
            }
            if (a.depName > b.depName) {
                return 1;
            }
            return 0;
        });
    }
    // Now assign first upgrade's config as branch config
    config = { ...config, ...config.upgrades[0], releaseTimestamp }; // TODO: fixme
    config.canBeUnpublished = config.upgrades.some((upgrade) => upgrade.canBeUnpublished);
    config.reuseLockFiles = config.upgrades.every((upgrade) => upgrade.updateType !== 'lockFileMaintenance');
    config.dependencyDashboardApproval = config.upgrades.some((upgrade) => upgrade.dependencyDashboardApproval);
    config.dependencyDashboardPrApproval = config.upgrades.some((upgrade) => upgrade.prCreation === 'approval');
    config.automerge = config.upgrades.every((upgrade) => upgrade.automerge);
    config.blockedByPin = config.upgrades.every((upgrade) => upgrade.blockedByPin);
    const tableRows = config.upgrades
        .map((upgrade) => getTableValues(upgrade))
        .filter(Boolean);
    if (tableRows.length) {
        let table = [];
        table.push(['datasource', 'package', 'from', 'to']);
        table = table.concat(tableRows);
        config.commitMessage += '\n\n' + markdown_table_1.default(table) + '\n';
    }
    return config;
}
exports.generateBranchConfig = generateBranchConfig;
//# sourceMappingURL=generate.js.map