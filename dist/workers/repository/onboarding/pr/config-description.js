"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigDesc = exports.getScheduleDesc = void 0;
const dist_1 = __importDefault(require("@sindresorhus/is/dist"));
const app_strings_1 = require("../../../../config/app-strings");
const logger_1 = require("../../../../logger");
const emoji_1 = require("../../../../util/emoji");
const defaultConfigFile = app_strings_1.configFileNames[0];
function getScheduleDesc(config) {
    logger_1.logger.debug('getScheduleDesc()');
    logger_1.logger.trace({ config });
    if (!config.schedule ||
        config.schedule === 'at any time' ||
        config.schedule[0] === 'at any time') {
        logger_1.logger.debug('No schedule');
        return [];
    }
    const desc = `Run Renovate on following schedule: ${config.schedule}`;
    return [desc];
}
exports.getScheduleDesc = getScheduleDesc;
function getDescriptionArray(config) {
    logger_1.logger.debug('getDescriptionArray()');
    logger_1.logger.trace({ config });
    const desc = dist_1.default.nonEmptyArray(config.description) ? config.description : [];
    return desc.concat(getScheduleDesc(config));
}
function getConfigDesc(config, packageFiles) {
    logger_1.logger.debug('getConfigDesc()');
    logger_1.logger.trace({ config });
    const descriptionArr = getDescriptionArray(config);
    if (!descriptionArr.length) {
        logger_1.logger.debug('No config description found');
        return '';
    }
    logger_1.logger.debug({ length: descriptionArr.length }, 'Found description array');
    let desc = `\n### Configuration Summary\n\nBased on the default config's presets, Renovate will:\n\n`;
    desc += `  - Start dependency updates only once this onboarding PR is merged\n`;
    descriptionArr.forEach((d) => {
        desc += `  - ${d}\n`;
    });
    desc += '\n';
    desc += emoji_1.emojify(`:abcd: Would you like to change the way Renovate is upgrading your dependencies?`);
    desc += ` Simply edit the \`${defaultConfigFile}\` in this branch with your custom config and the list of Pull Requests in the "What to Expect" section below will be updated the next time Renovate runs.`;
    desc += '\n\n---\n';
    return desc;
}
exports.getConfigDesc = getConfigDesc;
//# sourceMappingURL=config-description.js.map