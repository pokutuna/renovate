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
const js_yaml_1 = require("js-yaml");
const datasourceDart = __importStar(require("../../datasource/dart"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
function getDeps(depsObj, preset) {
    if (!depsObj) {
        return [];
    }
    return Object.keys(depsObj).reduce((acc, depName) => {
        if (depName === 'meta') {
            return acc;
        }
        const section = depsObj[depName];
        let currentValue = null;
        if (section === null || section === void 0 ? void 0 : section.version) {
            currentValue = section.version.toString();
        }
        else if (section) {
            if (typeof section === 'string') {
                currentValue = section;
            }
            if (typeof section === 'number') {
                currentValue = section.toString();
            }
        }
        const dep = { ...preset, depName, currentValue };
        if (!currentValue) {
            dep.skipReason = types_1.SkipReason.NotAVersion;
        }
        return [...acc, dep];
    }, []);
}
function extractPackageFile(content, packageFile) {
    try {
        const doc = js_yaml_1.safeLoad(content);
        const deps = [
            ...getDeps(doc.dependencies, {
                depType: 'dependencies',
            }),
            ...getDeps(doc.dev_dependencies, {
                depType: 'dev_dependencies',
            }),
        ];
        if (deps.length) {
            return {
                packageFile,
                datasource: datasourceDart.id,
                deps,
            };
        }
    }
    catch (e) {
        logger_1.logger.debug({ packageFile }, 'Can not parse dependency');
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map