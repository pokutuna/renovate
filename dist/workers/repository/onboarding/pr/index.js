"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOnboardingPr = void 0;
const logger_1 = require("../../../../logger");
const platform_1 = require("../../../../platform");
const emoji_1 = require("../../../../util/emoji");
const git_1 = require("../../../../util/git");
const pr_1 = require("../../../pr");
const base_branch_1 = require("./base-branch");
const config_description_1 = require("./config-description");
const errors_warnings_1 = require("./errors-warnings");
const pr_list_1 = require("./pr-list");
async function ensureOnboardingPr(config, packageFiles, branches) {
    var _a, _b, _c, _d, _e;
    if (config.repoIsOnboarded) {
        return;
    }
    logger_1.logger.debug('ensureOnboardingPr()');
    logger_1.logger.trace({ config });
    const existingPr = await platform_1.platform.getBranchPr(config.onboardingBranch);
    logger_1.logger.debug('Filling in onboarding PR template');
    let prTemplate = `Welcome to [Renovate](${config.productLinks.homepage})! This is an onboarding PR to help you understand and configure settings before regular Pull Requests begin.\n\n`;
    prTemplate += config.requireConfig
        ? emoji_1.emojify(`:vertical_traffic_light: To activate Renovate, merge this Pull Request. To disable Renovate, simply close this Pull Request unmerged.\n\n`)
        : emoji_1.emojify(`:vertical_traffic_light: Renovate will begin keeping your dependencies up-to-date only once you merge or close this Pull Request.\n\n`);
    prTemplate += emoji_1.emojify(`

---
{{PACKAGE FILES}}
{{CONFIG}}
{{BASEBRANCH}}
{{PRLIST}}
{{WARNINGS}}
{{ERRORS}}

---

:question: Got questions? Check out Renovate's [Docs](${config.productLinks.documentation}), particularly the Getting Started section.
If you need any further assistance then you can also [request help here](${config.productLinks.help}).
`);
    let prBody = prTemplate;
    if (packageFiles && Object.entries(packageFiles).length) {
        let files = [];
        for (const [manager, managerFiles] of Object.entries(packageFiles)) {
            files = files.concat(managerFiles.map((file) => ` * \`${file.packageFile}\` (${manager})`));
        }
        prBody =
            prBody.replace('{{PACKAGE FILES}}', '### Detected Package Files\n\n' + files.join('\n')) + '\n';
    }
    else {
        prBody = prBody.replace('{{PACKAGE FILES}}\n', '');
    }
    let configDesc = '';
    if (await git_1.isBranchModified(config.onboardingBranch)) {
        configDesc = emoji_1.emojify(`### Configuration\n\n:abcd: Renovate has detected a custom config for this PR. Feel free to ask for [help](${config.productLinks.help}) if you have any doubts and would like it reviewed.\n\n`);
        if (existingPr.isConflicted) {
            configDesc += emoji_1.emojify(`:warning: This PR has a merge conflict, however Renovate is unable to automatically fix that due to edits in this branch. Please resolve the merge conflict manually.\n\n`);
        }
        else {
            configDesc += `Important: Now that this branch is edited, Renovate can't rebase it from the base branch any more. If you make changes to the base branch that could impact this onboarding PR, please merge them manually.\n\n`;
        }
    }
    else {
        configDesc = config_description_1.getConfigDesc(config, packageFiles);
    }
    prBody = prBody.replace('{{CONFIG}}\n', configDesc);
    prBody = prBody.replace('{{WARNINGS}}\n', errors_warnings_1.getWarnings(config) + errors_warnings_1.getDepWarnings(packageFiles));
    prBody = prBody.replace('{{ERRORS}}\n', errors_warnings_1.getErrors(config));
    prBody = prBody.replace('{{BASEBRANCH}}\n', base_branch_1.getBaseBranchDesc(config));
    prBody = prBody.replace('{{PRLIST}}\n', pr_list_1.getPrList(config, branches));
    // istanbul ignore if
    if (config.prHeader) {
        prBody = (config.prHeader || '') + '\n\n' + prBody;
    }
    // istanbul ignore if
    if (config.prFooter) {
        prBody = prBody + '\n---\n\n' + config.prFooter + '\n';
    }
    logger_1.logger.trace('prBody:\n' + prBody);
    prBody = platform_1.platform.getPrBody(prBody);
    if (existingPr) {
        logger_1.logger.debug('Found open onboarding PR');
        // Check if existing PR needs updating
        if (existingPr.body.trim() === prBody.trim() // Bitbucket strips trailing \n
        ) {
            logger_1.logger.debug(`${existingPr.displayNumber} does not need updating`);
            return;
        }
        // PR must need updating
        // istanbul ignore if
        if (config.dryRun) {
            logger_1.logger.info('DRY-RUN: Would update onboarding PR');
        }
        else {
            await platform_1.platform.updatePr(existingPr.number, existingPr.title, prBody);
            logger_1.logger.info({ pr: existingPr.number }, 'Onboarding PR updated');
        }
        return;
    }
    logger_1.logger.debug('Creating onboarding PR');
    const labels = [];
    try {
        // istanbul ignore if
        if (config.dryRun) {
            logger_1.logger.info('DRY-RUN: Would create onboarding PR');
        }
        else {
            const pr = await platform_1.platform.createPr({
                branchName: config.onboardingBranch,
                targetBranch: config.defaultBranch,
                prTitle: config.onboardingPrTitle,
                prBody,
                labels,
            });
            logger_1.logger.info({ pr: pr.displayNumber }, 'Onboarding PR created');
            await pr_1.addAssigneesReviewers(config, pr);
        }
    }
    catch (err) /* istanbul ignore next */ {
        if (err.statusCode === 422 && ((_e = (_d = (_c = (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.startsWith('A pull request already exists'))) {
            logger_1.logger.debug('Onboarding PR already exists but cannot find it');
            await platform_1.platform.deleteBranch(config.onboardingBranch);
            return;
        }
        throw err;
    }
}
exports.ensureOnboardingPr = ensureOnboardingPr;
//# sourceMappingURL=index.js.map