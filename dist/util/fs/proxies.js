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
exports.move = exports.pathExists = exports.exists = exports.unlink = exports.remove = exports.outputFile = exports.writeFile = exports.readFile = exports.chmod = exports.stat = void 0;
const fs = __importStar(require("fs-extra"));
// istanbul ignore next
function stat(path) {
    return fs.stat(path);
}
exports.stat = stat;
// istanbul ignore next
function chmod(path, mode) {
    return fs.chmod(path, mode);
}
exports.chmod = chmod;
function readFile(fileName, encoding) {
    return fs.readFile(fileName, encoding);
}
exports.readFile = readFile;
// istanbul ignore next
function writeFile(fileName, fileContent) {
    return fs.writeFile(fileName, fileContent);
}
exports.writeFile = writeFile;
// istanbul ignore next
function outputFile(file, data, options) {
    return fs.outputFile(file, data, options !== null && options !== void 0 ? options : {});
}
exports.outputFile = outputFile;
function remove(dir) {
    return fs.remove(dir);
}
exports.remove = remove;
// istanbul ignore next
function unlink(path) {
    return fs.unlink(path);
}
exports.unlink = unlink;
// istanbul ignore next
function exists(path) {
    return fs.pathExists(path);
}
exports.exists = exists;
// istanbul ignore next
function pathExists(path) {
    return fs.pathExists(path);
}
exports.pathExists = pathExists;
// istanbul ignore next
function move(src, dest, options) {
    return fs.move(src, dest, options !== null && options !== void 0 ? options : {});
}
exports.move = move;
//# sourceMappingURL=proxies.js.map