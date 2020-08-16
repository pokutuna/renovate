"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
var extract_1 = require("./extract");
Object.defineProperty(exports, "extractPackageFile", { enumerable: true, get: function () { return extract_1.extractPackageFile; } });
var update_1 = require("./update");
Object.defineProperty(exports, "updateDependency", { enumerable: true, get: function () { return update_1.updateDependency; } });
exports.defaultConfig = {
    commitMessageTopic: 'Homebrew Formula {{depName}}',
    managerBranchPrefix: 'homebrew-',
    fileMatch: ['^Formula/[^/]+[.]rb$'],
};
//# sourceMappingURL=index.js.map