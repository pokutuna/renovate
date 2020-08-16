"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawExec = exports.BinarySource = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
var BinarySource;
(function (BinarySource) {
    BinarySource["Auto"] = "auto";
    BinarySource["Docker"] = "docker";
    BinarySource["Global"] = "global";
})(BinarySource = exports.BinarySource || (exports.BinarySource = {}));
exports.rawExec = util_1.promisify(child_process_1.exec);
//# sourceMappingURL=common.js.map