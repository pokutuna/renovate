"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getDefault = void 0;
const definitions_1 = require("./definitions");
const defaultValues = {
    boolean: true,
    array: [],
    string: null,
    object: null,
};
function getDefault(option) {
    return option.default === undefined
        ? defaultValues[option.type]
        : option.default;
}
exports.getDefault = getDefault;
function getConfig() {
    const options = definitions_1.getOptions();
    const config = {};
    options.forEach((option) => {
        if (!option.parent) {
            config[option.name] = getDefault(option);
        }
    });
    return config;
}
exports.getConfig = getConfig;
//# sourceMappingURL=defaults.js.map