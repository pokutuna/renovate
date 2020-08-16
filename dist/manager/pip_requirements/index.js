"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.language = void 0;
const languages_1 = require("../../constants/languages");
var artifacts_1 = require("./artifacts");
Object.defineProperty(exports, "updateArtifacts", { enumerable: true, get: function () { return artifacts_1.updateArtifacts; } });
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
var range_1 = require("./range");
Object.defineProperty(exports, "getRangeStrategy", { enumerable: true, get: function () { return range_1.getRangeStrategy; } });
exports.language = languages_1.LANGUAGE_PYTHON;
exports.defaultConfig = {
    fileMatch: ['(^|/)([\\w-]*)requirements.(txt|pip)$'],
};
//# sourceMappingURL=index.js.map