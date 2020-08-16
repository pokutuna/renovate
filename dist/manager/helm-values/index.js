"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
exports.defaultConfig = {
    commitMessageTopic: 'helm values {{depName}}',
    fileMatch: ['(^|/)values.yaml$'],
    pinDigests: false,
};
//# sourceMappingURL=index.js.map