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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChangeLogJSON = void 0;
const logger_1 = require("../../../logger");
const allVersioning = __importStar(require("../../../versioning"));
const releases_1 = require("./releases");
const sourceGithub = __importStar(require("./source-github"));
const sourceGitlab = __importStar(require("./source-gitlab"));
__exportStar(require("./common"), exports);
async function getChangeLogJSON(args) {
    var _a;
    const { sourceUrl, versioning, fromVersion, toVersion } = args;
    try {
        if (!sourceUrl) {
            return null;
        }
        const version = allVersioning.get(versioning);
        if (!fromVersion || version.equals(fromVersion, toVersion)) {
            return null;
        }
        const releases = args.releases || (await releases_1.getInRangeReleases(args));
        let res = null;
        if ((_a = args.sourceUrl) === null || _a === void 0 ? void 0 : _a.includes('gitlab')) {
            res = await sourceGitlab.getChangeLogJSON({ ...args, releases });
        }
        else {
            res = await sourceGithub.getChangeLogJSON({ ...args, releases });
        }
        return res;
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ config: args, err }, 'getChangeLogJSON error');
        return null;
    }
}
exports.getChangeLogJSON = getChangeLogJSON;
//# sourceMappingURL=index.js.map