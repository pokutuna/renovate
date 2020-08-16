"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleSize = exports.resolveFile = exports.setUtilConfig = void 0;
const find_up_1 = __importDefault(require("find-up"));
const upath_1 = require("upath");
const exec_1 = require("./exec");
const fs_1 = require("./fs");
async function setUtilConfig(config) {
    await exec_1.setExecConfig(config);
    fs_1.setFsConfig(config);
}
exports.setUtilConfig = setUtilConfig;
/**
 * Resolve path for a file relative to renovate root directory (our package.json)
 * @param file a file to resolve
 */
async function resolveFile(file) {
    const pkg = await find_up_1.default('package.json', { cwd: __dirname, type: 'file' });
    // istanbul ignore if
    if (!pkg) {
        throw new Error('Missing package.json');
    }
    return upath_1.join(pkg, '../', file);
}
exports.resolveFile = resolveFile;
function sampleSize(array, n) {
    const length = array == null ? 0 : array.length;
    if (!length || n < 1) {
        return [];
    }
    // eslint-disable-next-line no-param-reassign
    n = n > length ? length : n;
    let index = 0;
    const lastIndex = length - 1;
    const result = [...array];
    while (index < n) {
        const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
        [result[rand], result[index]] = [result[index], result[rand]];
        index += 1;
    }
    return result.slice(0, n);
}
exports.sampleSize = sampleSize;
//# sourceMappingURL=index.js.map