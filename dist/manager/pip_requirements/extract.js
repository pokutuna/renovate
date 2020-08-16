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
exports.extractPackageFile = exports.dependencyPattern = exports.packagePattern = void 0;
// based on https://www.python.org/dev/peps/pep-0508/#names
const specifier_1 = require("@renovate/pep440/lib/specifier");
const datasourcePypi = __importStar(require("../../datasource/pypi"));
const logger_1 = require("../../logger");
const types_1 = require("../../types");
const ignore_1 = require("../../util/ignore");
exports.packagePattern = '[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]';
const extrasPattern = '(?:\\s*\\[[^\\]]+\\])?';
const specifierPartPattern = `\\s*${specifier_1.RANGE_PATTERN.replace(/\?<\w+>/g, '?:')}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
exports.dependencyPattern = `(${exports.packagePattern})(${extrasPattern})(${specifierPattern})`;
function extractPackageFile(content, _, config) {
    var _a;
    logger_1.logger.trace('pip_requirements.extractPackageFile()');
    let indexUrl;
    const extraUrls = [];
    content.split('\n').forEach((line) => {
        if (line.startsWith('--index-url ')) {
            indexUrl = line.substring('--index-url '.length).split(' ')[0];
        }
        if (line.startsWith('--extra-index-url ')) {
            const extraUrl = line
                .substring('--extra-index-url '.length)
                .split(' ')[0];
            extraUrls.push(extraUrl);
        }
    });
    let registryUrls = [];
    if (indexUrl) {
        // index url in file takes precedence
        registryUrls.push(indexUrl);
    }
    else if ((_a = config.registryUrls) === null || _a === void 0 ? void 0 : _a.length) {
        // configured registryURls takes next precedence
        registryUrls = registryUrls.concat(config.registryUrls);
    }
    else if (extraUrls.length) {
        // Use default registry first if extra URLs are present and index URL is not
        registryUrls.push('https://pypi.org/pypi/');
    }
    registryUrls = registryUrls.concat(extraUrls);
    const regex = new RegExp(`^${exports.dependencyPattern}$`, 'g');
    const deps = content
        .split('\n')
        .map((rawline) => {
        let dep = {};
        const [line, comment] = rawline.split('#').map((part) => part.trim());
        if (ignore_1.isSkipComment(comment)) {
            dep.skipReason = types_1.SkipReason.Ignored;
        }
        regex.lastIndex = 0;
        const matches = regex.exec(line.split(' \\')[0]);
        if (!matches) {
            return null;
        }
        const [, depName, , currentValue] = matches;
        dep = {
            ...dep,
            depName,
            currentValue,
            datasource: datasourcePypi.id,
        };
        if (currentValue === null || currentValue === void 0 ? void 0 : currentValue.startsWith('==')) {
            dep.fromVersion = currentValue.replace(/^==/, '');
        }
        return dep;
    })
        .filter(Boolean);
    if (!deps.length) {
        return null;
    }
    const res = { deps };
    if (registryUrls.length > 0) {
        res.registryUrls = registryUrls.map((url) => {
            // handle the optional quotes in eg. `--extra-index-url "https://foo.bar"`
            const cleaned = url.replace(/^"/, '').replace(/"$/, '');
            if (global.trustLevel !== 'high') {
                return cleaned;
            }
            // interpolate any environment variables
            return cleaned.replace(/(\$[A-Za-z\d_]+)|(\${[A-Za-z\d_]+})/g, (match) => {
                const envvar = match.substring(1).replace(/^{/, '').replace(/}$/, '');
                const sub = process.env[envvar];
                return sub || match;
            });
        });
    }
    return res;
}
exports.extractPackageFile = extractPackageFile;
//# sourceMappingURL=extract.js.map