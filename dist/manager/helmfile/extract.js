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
const isValidChartName = (name) => {
    return !/[!@#$%^&*(),.?":{}/|<>A-Z]/.test(name);
};
function extractPackageFile(content, fileName, config) {
    let deps = [];
    let doc;
    const aliases = {};
    try {
        doc = js_yaml_1.default.safeLoad(content, { json: true });
    }
    catch (err) {
        logger_1.logger.debug({ err, fileName }, 'Failed to parse helmfile helmfile.yaml');
        return null;
    }
    if (!(doc && is_1.default.array(doc.releases))) {
        logger_1.logger.debug({ fileName }, 'helmfile.yaml has no releases');
        return null;
    }
    if (doc.repositories) {
        for (let i = 0; i < doc.repositories.length; i += 1) {
            aliases[doc.repositories[i].name] = doc.repositories[i].url;
        }
    }
    logger_1.logger.debug({ aliases }, 'repositories discovered.');
    deps = doc.releases.map((dep) => {
        let depName = dep.chart;
        let repoName = null;
        // If starts with ./ is for sure a local path
        if (dep.chart.startsWith('./')) {
            return {
                depName,
                skipReason: 'local-chart',
            };
        }
        if (dep.chart.includes('/')) {
            const v = dep.chart.split('/');
            repoName = v.shift();
            depName = v.join('/');
        }
        else {
            repoName = dep.chart;
        }
        const res = {
            depName,
            currentValue: dep.version,
            registryUrls: [aliases[repoName]]
                .concat([config.aliases[repoName]])
                .filter(Boolean),
        };
        // If version is null is probably a local chart
        if (!res.currentValue) {
            res.skipReason = types_1.SkipReason.LocalChart;
        }
        // By definition on helm the chart name should be lowecase letter + number + -
        // However helmfile support templating of that field
        if (!isValidChartName(res.depName)) {
            res.skipReason = types_1.SkipReason.UnsupportedChartType;
        }
        // Skip in case we cannot locate the registry
        if (is_1.default.emptyArray(res.registryUrls)) {
            res.skipReason = types_1.SkipReason.UnknownRegistry;
        }
        return res;
    });
    return { deps, datasource: datasourceHelm.id };
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map