"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.getVersionings = exports.getVersioningList = void 0;
const logger_1 = require("../logger");
const api_generated_1 = __importDefault(require("./api.generated"));
const common_1 = require("./common");
__exportStar(require("./common"), exports);
exports.getVersioningList = () => Array.from(api_generated_1.default.keys());
/**
 * Get versioning map. Can be used to dynamically add new versionig type
 */
exports.getVersionings = () => api_generated_1.default;
function get(versioning) {
    if (!versioning) {
        logger_1.logger.debug('Missing versioning');
        return api_generated_1.default.get('semver');
    }
    let versioningName;
    let versioningConfig;
    if (versioning.includes(':')) {
        const versionSplit = versioning.split(':');
        versioningName = versionSplit.shift();
        versioningConfig = versionSplit.join(':');
    }
    else {
        versioningName = versioning;
    }
    const theVersioning = api_generated_1.default.get(versioningName);
    if (!theVersioning) {
        logger_1.logger.info({ versioning }, 'Unknown versioning - defaulting to semver');
        return api_generated_1.default.get('semver');
    }
    if (common_1.isVersioningApiConstructor(theVersioning)) {
        // eslint-disable-next-line new-cap
        return new theVersioning(versioningConfig);
    }
    return theVersioning;
}
exports.get = get;
//# sourceMappingURL=index.js.map