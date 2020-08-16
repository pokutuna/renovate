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
exports.extractPackageFile = void 0;
const datasourceNpm = __importStar(require("../../datasource/npm"));
const logger_1 = require("../../logger");
function extractPackageFile(content) {
    let deps = [];
    const npmDepends = /\nNpm\.depends\({([\s\S]*?)}\);/.exec(content);
    if (!npmDepends) {
        return null;
    }
    try {
        deps = npmDepends[1]
            .replace(/(\s|\\n|\\t|'|")/g, '')
            .split(',')
            .map((dep) => dep.trim())
            .filter((dep) => dep.length)
            .map((dep) => dep.split(/:(.*)/))
            .map((arr) => {
            const [depName, currentValue] = arr;
            // istanbul ignore if
            if (!(depName && currentValue)) {
                logger_1.logger.warn({ content }, 'Incomplete npm.depends match');
            }
            return {
                depName,
                currentValue,
                datasource: datasourceNpm.id,
            };
        })
            .filter((dep) => dep.depName && dep.currentValue);
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ content }, 'Failed to parse meteor package.js');
    }
    // istanbul ignore if
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map