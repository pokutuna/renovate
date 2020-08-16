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
exports.defaultConfig = exports.supportsLockFileMaintenance = exports.language = void 0;
const languages_1 = require("../../constants/languages");
const npmVersioning = __importStar(require("../../versioning/npm"));
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractAllPackageFiles", { enumerable: true, get: function () { return extract_1.extractAllPackageFiles; } });
var update_1 = require("./update");
Object.defineProperty(exports, "updateDependency", { enumerable: true, get: function () { return update_1.updateDependency; } });
var range_1 = require("./range");
Object.defineProperty(exports, "getRangeStrategy", { enumerable: true, get: function () { return range_1.getRangeStrategy; } });
exports.language = languages_1.LANGUAGE_JAVASCRIPT;
exports.supportsLockFileMaintenance = true;
exports.defaultConfig = {
    fileMatch: ['(^|/)package.json$'],
    rollbackPrs: true,
    versioning: npmVersioning.id,
    prBodyDefinitions: {
        Change: "[{{#if displayFrom}}`{{{displayFrom}}}` -> {{else}}{{#if currentValue}}`{{{currentValue}}}` -> {{/if}}{{/if}}{{#if displayTo}}`{{{displayTo}}}`{{else}}`{{{newValue}}}`{{/if}}]({{#if depName}}https://renovatebot.com/diffs/npm/{{replace '/' '%2f' depName}}/{{{fromVersion}}}/{{{toVersion}}}{{/if}})",
    },
};
//# sourceMappingURL=index.js.map