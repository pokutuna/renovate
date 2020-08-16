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
const datasourceHelm = __importStar(require("../../datasource/helm"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
function extractPackageFile(content, fileName, config) {
    let chart;
    try {
        chart = js_yaml_1.default.safeLoad(content, { json: true });
        if (!((chart === null || chart === void 0 ? void 0 : chart.apiVersion) && chart.name && chart.version)) {
            logger_1.logger.debug({ fileName }, 'Failed to find required fields in Chart.yaml');
            return null;
        }
        if (chart.apiVersion !== 'v2') {
            logger_1.logger.debug({ fileName }, 'Unsupported Chart apiVersion. Only v2 is supported.');
            return null;
        }
    }
    catch (err) {
        logger_1.logger.debug({ fileName }, 'Failed to parse helm Chart.yaml');
        return null;
    }
    let deps = [];
    if (!is_1.default.nonEmptyArray(chart === null || chart === void 0 ? void 0 : chart.dependencies)) {
        logger_1.logger.debug({ fileName }, 'Chart has no dependencies');
        return null;
    }
    const validDependencies = chart.dependencies.filter((dep) => is_1.default.nonEmptyString(dep.name) && is_1.default.nonEmptyString(dep.version));
    if (!is_1.default.nonEmptyArray(validDependencies)) {
        logger_1.logger.debug('Name and/or version missing for all dependencies');
        return null;
    }
    deps = validDependencies.map((dep) => {
        const res = {
            depName: dep.name,
            currentValue: dep.version,
        };
        if (dep.repository) {
            res.registryUrls = [dep.repository];
            if (dep.repository.startsWith('@')) {
                const repoWithAtRemoved = dep.repository.slice(1);
                const alias = config.aliases[repoWithAtRemoved];
                if (alias) {
                    res.registryUrls = [alias];
                    return res;
                }
                res.skipReason = types_1.SkipReason.PlaceholderUrl;
            }
            else {
                try {
                    const url = new URL(dep.repository);
                    if (url.protocol === 'file:') {
                        res.skipReason = types_1.SkipReason.LocalDependency;
                    }
                }
                catch (err) {
                    logger_1.logger.debug({ err }, 'Error parsing url');
                    res.skipReason = types_1.SkipReason.InvalidUrl;
                }
            }
        }
        else {
            res.skipReason = types_1.SkipReason.NoRepository;
        }
        return res;
    });
    const res = {
        deps,
        datasource: datasourceHelm.id,
    };
    return res;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map