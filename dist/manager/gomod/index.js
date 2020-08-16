"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.updateArtifacts = exports.updateDependency = exports.extractPackageFile = exports.language = void 0;
const languages_1 = require("../../constants/languages");
const artifacts_1 = require("./artifacts");
Object.defineProperty(exports, "updateArtifacts", { enumerable: true, get: function () { return artifacts_1.updateArtifacts; } });
const extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
const update_1 = require("./update");
Object.defineProperty(exports, "updateDependency", { enumerable: true, get: function () { return update_1.updateDependency; } });
exports.language = languages_1.LANGUAGE_GOLANG;
exports.defaultConfig = {
    fileMatch: ['(^|/)go.mod$'],
};
//# sourceMappingURL=index.js.map