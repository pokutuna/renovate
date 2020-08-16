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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCacheDir = exports.ensureLocalDir = exports.ensureDir = exports.deleteLocalFile = exports.writeLocalFile = exports.readLocalFile = exports.getSiblingFileName = exports.getSubDirectory = exports.setFsConfig = void 0;
const fs = __importStar(require("fs-extra"));
const upath_1 = require("upath");
const logger_1 = require("../../logger");
__exportStar(require("./proxies"), exports);
let localDir = '';
let cacheDir = '';
function setFsConfig(config) {
    localDir = config.localDir;
    cacheDir = config.cacheDir;
}
exports.setFsConfig = setFsConfig;
function getSubDirectory(fileName) {
    return upath_1.parse(fileName).dir;
}
exports.getSubDirectory = getSubDirectory;
function getSiblingFileName(existingFileNameWithPath, otherFileName) {
    const subDirectory = getSubDirectory(existingFileNameWithPath);
    return upath_1.join(subDirectory, otherFileName);
}
exports.getSiblingFileName = getSiblingFileName;
async function readLocalFile(fileName, encoding) {
    const localFileName = upath_1.join(localDir, fileName);
    try {
        const fileContent = await fs.readFile(localFileName, encoding);
        return fileContent;
    }
    catch (err) {
        logger_1.logger.trace({ err }, 'Error reading local file');
        return null;
    }
}
exports.readLocalFile = readLocalFile;
async function writeLocalFile(fileName, fileContent) {
    const localFileName = upath_1.join(localDir, fileName);
    await fs.outputFile(localFileName, fileContent);
}
exports.writeLocalFile = writeLocalFile;
async function deleteLocalFile(fileName) {
    const localFileName = upath_1.join(localDir, fileName);
    await fs.remove(localFileName);
}
exports.deleteLocalFile = deleteLocalFile;
// istanbul ignore next
async function ensureDir(dirName) {
    await fs.ensureDir(dirName);
}
exports.ensureDir = ensureDir;
// istanbul ignore next
async function ensureLocalDir(dirName) {
    const localDirName = upath_1.join(localDir, dirName);
    await fs.ensureDir(localDirName);
}
exports.ensureLocalDir = ensureLocalDir;
async function ensureCacheDir(dirName, envPathVar) {
    const envCacheDirName = envPathVar ? process.env[envPathVar] : null;
    const cacheDirName = envCacheDirName || upath_1.join(cacheDir, dirName);
    await fs.ensureDir(cacheDirName);
    return cacheDirName;
}
exports.ensureCacheDir = ensureCacheDir;
//# sourceMappingURL=index.js.map