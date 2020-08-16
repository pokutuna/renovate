"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = require("../../logger");
function extractPackageFile(content) {
    let doc;
    try {
        doc = js_yaml_1.default.safeLoad(content, { json: true });
    }
    catch (err) {
        logger_1.logger.warn({ err, content }, 'Failed to parse .travis.yml file.');
        return null;
    }
    let deps = [];
    if (doc && is_1.default.array(doc.node_js)) {
        deps = [
            {
                depName: 'node',
                currentValue: doc.node_js,
            },
        ];
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map