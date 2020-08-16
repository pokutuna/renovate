"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPackageFile = void 0;
const js_yaml_1 = require("js-yaml");
const logger_1 = require("../../logger");
const extract_1 = require("../dockerfile/extract");
class LineMapper {
    constructor(content, filter) {
        this.imageLines = [...content.split('\n').entries()]
            .filter((entry) => filter.test(entry[1]))
            .map(([lineNumber, line]) => ({ lineNumber, line, used: false }));
    }
    pluckLineNumber(imageName) {
        const lineMeta = this.imageLines.find(({ line, used }) => !used && line.includes(imageName));
        // istanbul ignore if
        if (!lineMeta) {
            return null;
        }
        lineMeta.used = true; // unset plucked lines so duplicates are skipped
        return lineMeta.lineNumber;
    }
}
function extractPackageFile(content, fileName) {
    logger_1.logger.debug('docker-compose.extractPackageFile()');
    let config;
    try {
        config = js_yaml_1.safeLoad(content, { json: true });
        if (!config) {
            logger_1.logger.debug({ fileName }, 'Null config when parsing Docker Compose content');
            return null;
        }
        if (typeof config !== 'object') {
            logger_1.logger.debug({ fileName, type: typeof config }, 'Unexpected type for Docker Compose content');
            return null;
        }
    }
    catch (err) {
        logger_1.logger.debug({ err }, 'err');
        logger_1.logger.debug({ fileName }, 'Parsing Docker Compose config YAML');
        return null;
    }
    try {
        const lineMapper = new LineMapper(content, /^\s*image:/);
        const services = 'version' in config
            ? config.services // docker-compose version 2+
            : config; // docker-compose version 1 (services at top level)
        // Image name/tags for services are only eligible for update if they don't
        // use variables and if the image is not built locally
        const deps = Object.values(services || {})
            .filter((service) => (service === null || service === void 0 ? void 0 : service.image) && !(service === null || service === void 0 ? void 0 : service.build))
            .map((service) => {
            const dep = extract_1.getDep(service.image);
            const lineNumber = lineMapper.pluckLineNumber(service.image);
            // istanbul ignore if
            if (!lineNumber) {
                return null;
            }
            return dep;
        })
            .filter(Boolean);
        logger_1.logger.trace({ deps }, 'Docker Compose image');
        return { deps };
    }
    catch (err) /* istanbul ignore next */ {
        logger_1.logger.warn({ fileName, content, err }, 'Error extracting Docker Compose file');
        return null;
    }
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map