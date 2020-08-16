"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.language = exports.extractPackageFile = void 0;
const languages_1 = require("../../constants/languages");
const extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
const language = languages_1.LANGUAGE_DOCKER;
exports.language = language;
exports.defaultConfig = {
    fileMatch: ['(^|/).drone.yml$'],
};
//# sourceMappingURL=index.js.map