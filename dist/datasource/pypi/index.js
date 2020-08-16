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
exports.getReleases = exports.registryStrategy = exports.defaultRegistryUrls = exports.id = void 0;
const url_1 = __importDefault(require("url"));
const changelog_filename_regex_1 = __importDefault(require("changelog-filename-regex"));
const node_html_parser_1 = require("node-html-parser");
const logger_1 = require("../../logger");
const http_1 = require("../../util/http");
const url_2 = require("../../util/url");
const pep440_1 = require("../../versioning/pep440");
const pep440 = __importStar(require("../../versioning/pep440"));
exports.id = 'pypi';
exports.defaultRegistryUrls = [
    process.env.PIP_INDEX_URL || 'https://pypi.org/pypi/',
];
exports.registryStrategy = 'merge';
const github_repo_pattern = /^https?:\/\/github\.com\/[^\\/]+\/[^\\/]+$/;
const http = new http_1.Http(exports.id);
function normalizeName(input) {
    return input.toLowerCase().replace(/(-|\.)/g, '_');
}
function compatibleVersions(releases, compatibility) {
    const versions = Object.keys(releases);
    if (!((compatibility === null || compatibility === void 0 ? void 0 : compatibility.python) && pep440.isVersion(compatibility.python))) {
        return versions;
    }
    return versions.filter((version) => releases[version].some((release) => {
        if (!release.requires_python) {
            return true;
        }
        return pep440_1.matches(compatibility.python, release.requires_python);
    }));
}
async function getDependency(packageName, hostUrl, compatibility) {
    var _a, _b;
    const lookupUrl = url_1.default.resolve(hostUrl, `${packageName}/json`);
    const dependency = { releases: null };
    logger_1.logger.trace({ lookupUrl }, 'Pypi api got lookup');
    const rep = await http.getJson(lookupUrl);
    const dep = rep === null || rep === void 0 ? void 0 : rep.body;
    if (!dep) {
        logger_1.logger.trace({ dependency: packageName }, 'pip package not found');
        return null;
    }
    logger_1.logger.trace({ lookupUrl }, 'Got pypi api result');
    if (!(dep.info && normalizeName(dep.info.name) === normalizeName(packageName))) {
        logger_1.logger.warn({ lookupUrl, lookupName: packageName, returnedName: dep.info.name }, 'Returned name does not match with requested name');
        return null;
    }
    if ((_a = dep.info) === null || _a === void 0 ? void 0 : _a.home_page) {
        dependency.homepage = dep.info.home_page;
        if (github_repo_pattern.exec(dep.info.home_page)) {
            dependency.sourceUrl = dep.info.home_page.replace('http://', 'https://');
        }
    }
    if ((_b = dep.info) === null || _b === void 0 ? void 0 : _b.project_urls) {
        for (const [name, projectUrl] of Object.entries(dep.info.project_urls)) {
            const lower = name.toLowerCase();
            if (!dependency.sourceUrl &&
                (lower.startsWith('repo') ||
                    lower === 'code' ||
                    lower === 'source' ||
                    github_repo_pattern.exec(projectUrl))) {
                dependency.sourceUrl = projectUrl;
            }
            if (!dependency.changelogUrl &&
                ([
                    'changelog',
                    'change log',
                    'changes',
                    'release notes',
                    'news',
                    "what's new",
                ].includes(lower) ||
                    changelog_filename_regex_1.default.exec(lower))) {
                // from https://github.com/pypa/warehouse/blob/418c7511dc367fb410c71be139545d0134ccb0df/warehouse/templates/packaging/detail.html#L24
                dependency.changelogUrl = projectUrl;
            }
        }
    }
    dependency.releases = [];
    if (dep.releases) {
        const versions = compatibleVersions(dep.releases, compatibility);
        dependency.releases = versions.map((version) => {
            const releases = dep.releases[version] || [];
            const { upload_time: releaseTimestamp } = releases[0] || {};
            const isDeprecated = releases.some(({ yanked }) => yanked);
            const result = {
                version,
                releaseTimestamp,
            };
            if (isDeprecated) {
                result.isDeprecated = isDeprecated;
            }
            return result;
        });
    }
    return dependency;
}
function extractVersionFromLinkText(text, packageName) {
    const srcPrefixes = [`${packageName}-`, `${packageName.replace(/-/g, '_')}-`];
    for (const prefix of srcPrefixes) {
        const suffix = '.tar.gz';
        if (text.startsWith(prefix) && text.endsWith(suffix)) {
            return text.replace(prefix, '').replace(/\.tar\.gz$/, '');
        }
    }
    // pep-0427 wheel packages
    //  {distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl.
    const wheelPrefix = packageName.replace(/[^\w\d.]+/g, '_') + '-';
    const wheelSuffix = '.whl';
    if (text.startsWith(wheelPrefix) &&
        text.endsWith(wheelSuffix) &&
        text.split('-').length > 2) {
        return text.split('-')[1];
    }
    return null;
}
async function getSimpleDependency(packageName, hostUrl) {
    const lookupUrl = url_1.default.resolve(hostUrl, `${packageName}`);
    const dependency = { releases: null };
    const response = await http.get(lookupUrl);
    const dep = response === null || response === void 0 ? void 0 : response.body;
    if (!dep) {
        logger_1.logger.trace({ dependency: packageName }, 'pip package not found');
        return null;
    }
    const root = node_html_parser_1.parse(dep.replace(/<\/?pre>/, ''));
    const links = root.querySelectorAll('a');
    const releases = new Map();
    for (const link of Array.from(links)) {
        const version = extractVersionFromLinkText(link.text, packageName);
        if (version) {
            const release = releases.get(version) || { version };
            const isDeprecated = link.hasAttribute('data-yanked');
            if (isDeprecated) {
                release.isDeprecated = isDeprecated;
            }
            releases.set(version, release);
        }
    }
    dependency.releases = [...releases.values()];
    return dependency;
}
async function getReleases({ compatibility, lookupName, registryUrl, }) {
    const hostUrl = url_2.ensureTrailingSlash(registryUrl);
    // not all simple indexes use this identifier, but most do
    if (hostUrl.endsWith('/simple/') || hostUrl.endsWith('/+simple/')) {
        logger_1.logger.trace({ lookupName, hostUrl }, 'Looking up pypi simple dependency');
        return getSimpleDependency(lookupName, hostUrl);
    }
    logger_1.logger.trace({ lookupName, hostUrl }, 'Looking up pypi api dependency');
    try {
        // we need to resolve early here so we can catch any 404s and fallback to a simple lookup
        const releases = await getDependency(lookupName, hostUrl, compatibility);
        // the dep was found in the json api, return as-is
        return releases;
    }
    catch (err) {
        if (err.statusCode !== 404) {
            throw err;
        }
        // error contacting json-style api -- attempt to fallback to a simple-style api
        logger_1.logger.trace({ lookupName, hostUrl }, 'Looking up pypi simple dependency via fallback');
        const releases = await getSimpleDependency(lookupName, hostUrl);
        return releases;
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map