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
exports.defaultConfig = exports.language = exports.getRangeStrategy = exports.updateArtifacts = exports.extractPackageFile = exports.supportsLockFileMaintenance = void 0;
const languages_1 = require("../../constants/languages");
const rubyVersioning = __importStar(require("../../versioning/ruby"));
const artifacts_1 = require("./artifacts");
Object.defineProperty(exports, "updateArtifacts", { enumerable: true, get: function () { return artifacts_1.updateArtifacts; } });
const extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
const range_1 = require("./range");
Object.defineProperty(exports, "getRangeStrategy", { enumerable: true, get: function () { return range_1.getRangeStrategy; } });
const language = languages_1.LANGUAGE_RUBY;
exports.language = language;
exports.supportsLockFileMaintenance = true;
exports.defaultConfig = {
    fileMatch: ['(^|/)Gemfile$'],
    versioning: rubyVersioning.id,
};
//# sourceMappingURL=index.js.map