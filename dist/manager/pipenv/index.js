"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.supportsLockFileMaintenance = exports.language = void 0;
const languages_1 = require("../../constants/languages");
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
var artifacts_1 = require("./artifacts");
Object.defineProperty(exports, "updateArtifacts", { enumerable: true, get: function () { return artifacts_1.updateArtifacts; } });
exports.language = languages_1.LANGUAGE_PYTHON;
exports.supportsLockFileMaintenance = true;
exports.defaultConfig = {
    fileMatch: ['(^|/)Pipfile$'],
};
//# sourceMappingURL=index.js.map