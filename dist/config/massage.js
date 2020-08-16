"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.massageConfig = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const clone_1 = require("../util/clone");
const definitions_1 = require("./definitions");
const options = definitions_1.getOptions();
let allowedStrings;
// Returns a massaged config
function massageConfig(config) {
    if (!allowedStrings) {
        allowedStrings = [];
        options.forEach((option) => {
            if (option.allowString) {
                allowedStrings.push(option.name);
            }
        });
    }
    const massagedConfig = clone_1.clone(config);
    for (const [key, val] of Object.entries(config)) {
        if (allowedStrings.includes(key) && is_1.default.string(val)) {
            massagedConfig[key] = [val];
        }
        else if (key === 'npmToken' && is_1.default.string(val) && val.length < 50) {
            massagedConfig.npmrc = `//registry.npmjs.org/:_authToken=${val}\n`;
            delete massagedConfig.npmToken;
        }
        else if (is_1.default.array(val)) {
            massagedConfig[key] = [];
            val.forEach((item) => {
                if (is_1.default.object(item)) {
                    massagedConfig[key].push(massageConfig(item));
                }
                else {
                    massagedConfig[key].push(item);
                }
            });
        }
        else if (is_1.default.object(val) && key !== 'encrypted') {
            massagedConfig[key] = massageConfig(val);
        }
    }
    if (is_1.default.nonEmptyArray(massagedConfig.packageRules)) {
        const newRules = [];
        const updateTypes = [
            'major',
            'minor',
            'patch',
            'pin',
            'digest',
            'lockFileMaintenance',
            'rollback',
        ];
        for (const rule of massagedConfig.packageRules) {
            newRules.push(rule);
            for (const [key, val] of Object.entries(rule)) {
                if (updateTypes.includes(key)) {
                    const newRule = clone_1.clone(rule);
                    newRule.updateTypes = rule.updateTypes || [];
                    newRule.updateTypes.push(key);
                    Object.assign(newRule, val);
                    newRules.push(newRule);
                }
            }
        }
        for (const rule of newRules) {
            updateTypes.forEach((updateType) => {
                delete rule[updateType];
            });
        }
        massagedConfig.packageRules = newRules;
    }
    return massagedConfig;
}
exports.massageConfig = massageConfig;
//# sourceMappingURL=massage.js.map