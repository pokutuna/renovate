"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModules = void 0;
const fs_1 = __importDefault(require("fs"));
const upath_1 = require("upath");
function relatePath(here, there) {
    const thereParts = upath_1.normalizeTrim(there).split(/[\\/]/);
    const hereParts = upath_1.normalizeTrim(here).split(/[\\/]/);
    let idx = 0;
    while (typeof thereParts[idx] === 'string' &&
        typeof hereParts[idx] === 'string' &&
        thereParts[idx] === hereParts[idx]) {
        idx += 1;
    }
    const result = [];
    for (let x = 0; x < hereParts.length - idx; x += 1) {
        result.push('..');
    }
    for (let y = idx; y < thereParts.length; y += 1) {
        result.push(thereParts[idx]);
    }
    return result.join('/');
}
function loadModules(dirname, validate, filter = () => true) {
    const result = {};
    const moduleNames = fs_1.default
        .readdirSync(dirname, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .filter((name) => !name.startsWith('__'))
        .filter(filter)
        .sort();
    for (const moduleName of moduleNames) {
        const modulePath = upath_1.join(relatePath(__dirname, dirname), moduleName);
        const module = require(modulePath); // eslint-disable-line
        // istanbul ignore if
        if (!module || (validate && !validate(module, moduleName))) {
            throw new Error(`Invalid module: ${modulePath}`);
        }
        result[moduleName] = module;
    }
    return result;
}
exports.loadModules = loadModules;
//# sourceMappingURL=modules.js.map