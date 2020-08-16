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
exports.getPrBody = void 0;
const platform_1 = require("../../../platform");
const template = __importStar(require("../../../util/template"));
const versioning_1 = require("../../../versioning");
const changelogs_1 = require("./changelogs");
const config_description_1 = require("./config-description");
const controls_1 = require("./controls");
const footer_1 = require("./footer");
const header_1 = require("./header");
const notes_1 = require("./notes");
const updates_table_1 = require("./updates-table");
function massageUpdateMetadata(config) {
    config.upgrades.forEach((upgrade) => {
        /* eslint-disable no-param-reassign */
        const { homepage, sourceUrl, sourceDirectory, changelogUrl } = upgrade;
        let depNameLinked = upgrade.depName;
        const primaryLink = homepage || sourceUrl;
        if (primaryLink) {
            depNameLinked = `[${depNameLinked}](${primaryLink})`;
        }
        const otherLinks = [];
        if (homepage && sourceUrl) {
            otherLinks.push(`[source](${sourceUrl})`);
        }
        if (changelogUrl) {
            otherLinks.push(`[changelog](${changelogUrl})`);
        }
        if (otherLinks.length) {
            depNameLinked += ` (${otherLinks.join(', ')})`;
        }
        upgrade.depNameLinked = depNameLinked;
        const references = [];
        if (homepage) {
            references.push(`[homepage](${homepage})`);
        }
        if (sourceUrl) {
            let fullUrl = sourceUrl;
            if (sourceDirectory) {
                fullUrl =
                    sourceUrl.replace(/\/?$/, '/') +
                        'tree/HEAD/' +
                        sourceDirectory.replace('^/?/', '');
            }
            references.push(`[source](${fullUrl})`);
        }
        if (changelogUrl) {
            references.push(`[changelog](${changelogUrl})`);
        }
        upgrade.references = references.join(', ');
        const { fromVersion, toVersion, updateType, versioning } = upgrade;
        // istanbul ignore if
        if (updateType === 'minor') {
            try {
                const version = versioning_1.get(versioning);
                if (version.getMinor(fromVersion) === version.getMinor(toVersion)) {
                    upgrade.updateType = 'patch';
                }
            }
            catch (err) {
                // do nothing
            }
        }
        /* eslint-enable no-param-reassign */
    });
}
async function getPrBody(config) {
    massageUpdateMetadata(config);
    const content = {
        header: header_1.getPrHeader(config),
        table: updates_table_1.getPrUpdatesTable(config),
        notes: notes_1.getPrNotes(config) + notes_1.getPrExtraNotes(config),
        changelogs: changelogs_1.getChangelogs(config),
        configDescription: await config_description_1.getPrConfigDescription(config),
        controls: controls_1.getControls(),
        footer: footer_1.getPrFooter(config),
    };
    const defaultPrBodyTemplate = '{{{header}}}{{{table}}}{{{notes}}}{{{changelogs}}}{{{configDescription}}}{{{controls}}}{{{footer}}}';
    const prBodyTemplate = config.prBodyTemplate || defaultPrBodyTemplate;
    let prBody = template.compile(prBodyTemplate, content, false);
    prBody = prBody.trim();
    prBody = prBody.replace(/\n\n\n+/g, '\n\n');
    prBody = platform_1.platform.getPrBody(prBody);
    return prBody;
}
exports.getPrBody = getPrBody;
//# sourceMappingURL=index.js.map