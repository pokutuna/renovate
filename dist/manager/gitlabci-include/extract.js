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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const is_1 = __importDefault(require("@sindresorhus/is"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const datasourceGitlabTags = __importStar(require("../../datasource/gitlab-tags"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const fs_1 = require("../../util/fs");
const gitlabci = __importStar(require("../gitlabci/extract"));
function extractDepFromIncludeFile(includeObj) {
    const dep = {
        datasource: datasourceGitlabTags.id,
        depName: includeObj.project,
        depType: 'repository',
    };
    if (!includeObj.ref) {
        dep.skipReason = types_1.SkipReason.UnknownVersion;
        return dep;
    }
    dep.currentValue = includeObj.ref;
    return dep;
}
async function extractDepsFromIncludeLocal(includeObj) {
    var _a;
    const content = await fs_1.readLocalFile(includeObj.local, 'utf8');
    const deps = (_a = gitlabci.extractPackageFile(content)) === null || _a === void 0 ? void 0 : _a.deps;
    return deps;
}
async function extractPackageFile(content, _packageFile, config) {
    var _a;
    const deps = [];
    try {
        const doc = js_yaml_1.default.safeLoad(content, { json: true });
        if ((doc === null || doc === void 0 ? void 0 : doc.include) && is_1.default.array(doc.include)) {
            for (const includeObj of doc.include) {
                if (includeObj.file && includeObj.project) {
                    const dep = extractDepFromIncludeFile(includeObj);
                    if (config.endpoint) {
                        dep.registryUrls = [config.endpoint.replace(/\/api\/v4\/?/, '')];
                    }
                    deps.push(dep);
                }
                else if (includeObj.local) {
                    const includedDeps = await extractDepsFromIncludeLocal(includeObj);
                    if (includedDeps) {
                        for (const includedDep of includedDeps) {
                            deps.push(includedDep);
                        }
                    }
                }
            }
        }
    }
    catch (err) /* istanbul ignore next */ {
        if ((_a = err.stack) === null || _a === void 0 ? void 0 : _a.startsWith('YAMLException:')) {
            logger_1.logger.debug({ err });
            logger_1.logger.debug('YAML exception extracting GitLab CI includes');
        }
        else {
            logger_1.logger.warn({ err }, 'Error extracting GitLab CI includes');
        }
    }
    if (!deps.length) {
        return null;
    }
    return { deps };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map