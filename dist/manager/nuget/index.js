"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = exports.language = void 0;
const languages_1 = require("../../constants/languages");
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
exports.language = languages_1.LANGUAGE_DOT_NET;
exports.defaultConfig = {
    fileMatch: [
        '\\.(?:cs|fs|vb)proj$',
        '\\.(?:props|targets)$',
        '\\.config\\/dotnet-tools\\.json$',
    ],
};
//# sourceMappingURL=index.js.map