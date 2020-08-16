"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const logger_1 = require("../../logger");
const extract_1 = require("../dockerfile/extract");
const util_1 = require("./util");
/**
 * Recursively find all supported dependencies in the yaml object.
 *
 * @param parsedContent
 */
function findDependencies(parsedContent, packageDependencies) {
    if (!parsedContent || typeof parsedContent !== 'object') {
        return packageDependencies;
    }
    Object.keys(parsedContent).forEach((key) => {
        if (util_1.matchesHelmValuesDockerHeuristic(key, parsedContent[key])) {
            const currentItem = parsedContent[key];
            const registry = currentItem.registry ? `${currentItem.registry}/` : '';
            packageDependencies.push(extract_1.getDep(`${registry}${currentItem.repository}:${currentItem.tag}`, false));
        }
        else {
            findDependencies(parsedContent[key], packageDependencies);
        }
    });
    return packageDependencies;
}
function extractPackageFile(content) {
    let parsedContent;
    try {
        // a parser that allows extracting line numbers would be preferable, with
        // the current approach we need to match anything we find again during the update
        parsedContent = js_yaml_1.default.safeLoad(content, { json: true });
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'Failed to parse helm-values YAML');
        return null;
    }
    try {
        const deps = findDependencies(parsedContent, []);
        if (deps.length) {
            logger_1.logger.debug({ deps }, 'Found dependencies in helm-values');
            return { deps };
        }
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.error({ err }, 'Error parsing helm-values parsed content');
    }
    return null;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map