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
exports.mergeChildConfig = void 0;
const logger_1 = require("../logger");
const clone_1 = require("../util/clone");
const definitions = __importStar(require("./definitions"));
function mergeChildConfig(parent, child) {
    logger_1.logger.trace({ parent, child }, `mergeChildConfig`);
    if (!child) {
        return parent;
    }
    const parentConfig = clone_1.clone(parent);
    const childConfig = clone_1.clone(child);
    const config = { ...parentConfig, ...childConfig };
    for (const option of definitions.getOptions()) {
        if (option.mergeable &&
            childConfig[option.name] &&
            parentConfig[option.name]) {
            logger_1.logger.trace(`mergeable option: ${option.name}`);
            if (option.type === 'array') {
                config[option.name] = parentConfig[option.name].concat(config[option.name]);
            }
            else {
                config[option.name] = mergeChildConfig(parentConfig[option.name], childConfig[option.name]);
            }
            logger_1.logger.trace({ result: config[option.name] }, `Merged config.${option.name}`);
        }
    }
    return Object.assign(config, config.force);
}
exports.mergeChildConfig = mergeChildConfig;
//# sourceMappingURL=utils.js.map