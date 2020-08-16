"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrConfigDescription = void 0;
const platform_1 = require("../../../platform");
const types_1 = require("../../../types");
const emoji_1 = require("../../../util/emoji");
async function getPrConfigDescription(config) {
    let prBody = `\n\n---\n\n### Renovate configuration\n\n`;
    prBody += emoji_1.emojify(`:date: **Schedule**: `);
    if (config.schedule &&
        config.schedule !== 'at any time' &&
        config.schedule[0] !== 'at any time') {
        prBody += `"${config.schedule}"`;
        if (config.timezone) {
            prBody += ` in timezone ${config.timezone}.`;
        }
        else {
            prBody += ` (UTC).`;
        }
    }
    else {
        prBody += 'At any time (no schedule defined).';
    }
    prBody += '\n\n';
    prBody += emoji_1.emojify(':vertical_traffic_light: **Automerge**: ');
    if (config.automerge) {
        const branchStatus = await platform_1.platform.getBranchStatus(config.branchName, config.requiredStatusChecks);
        // istanbul ignore if
        if (branchStatus === types_1.BranchStatus.red) {
            prBody += 'Disabled due to failing status checks.';
        }
        else {
            prBody += 'Enabled.';
        }
    }
    else {
        prBody +=
            'Disabled by config. Please merge this manually once you are satisfied.';
    }
    prBody += '\n\n';
    prBody += emoji_1.emojify(':recycle: **Rebasing**: ');
    if (config.rebaseWhen === 'behind-base-branch') {
        prBody += 'Whenever PR is behind base branch';
    }
    else if (config.rebaseWhen === 'never') {
        prBody += 'Never';
    }
    else {
        prBody += 'Whenever PR becomes conflicted';
    }
    prBody += `, or you tick the rebase/retry checkbox.\n\n`;
    if (config.recreateClosed) {
        prBody += emoji_1.emojify(`:ghost: **Immortal**: This PR will be recreated if closed unmerged. Get [config help](${config.productLinks.help}) if that's undesired.\n\n`);
    }
    else {
        prBody += emoji_1.emojify(`:no_bell: **Ignore**: Close this PR and you won't be reminded about ${config.upgrades.length === 1 ? 'this update' : 'these updates'} again.\n\n`);
    }
    return prBody;
}
exports.getPrConfigDescription = getPrConfigDescription;
//# sourceMappingURL=config-description.js.map