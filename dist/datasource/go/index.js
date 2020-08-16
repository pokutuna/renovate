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
exports.getDigest = exports.getReleases = exports.id = void 0;
const logger_1 = require("../../logger");
const http_1 = require("../../util/http");
const regex_1 = require("../../util/regex");
const github = __importStar(require("../github-tags"));
const gitlab = __importStar(require("../gitlab-tags"));
exports.id = 'go';
const http = new http_1.Http(exports.id);
async function getDatasource(goModule) {
    if (goModule.startsWith('gopkg.in/')) {
        const [pkg] = goModule.replace('gopkg.in/', '').split('.');
        if (pkg.includes('/')) {
            return { datasource: github.id, lookupName: pkg };
        }
        return {
            datasource: github.id,
            lookupName: `go-${pkg}/${pkg}`,
        };
    }
    if (goModule.startsWith('github.com/')) {
        const split = goModule.split('/');
        const lookupName = split[1] + '/' + split[2];
        return {
            datasource: github.id,
            lookupName,
        };
    }
    const pkgUrl = `https://${goModule}?go-get=1`;
    const res = (await http.get(pkgUrl)).body;
    const sourceMatch = regex_1.regEx(`<meta\\s+name="go-source"\\s+content="([^\\s]+)\\s+([^\\s]+)`).exec(res);
    if (sourceMatch) {
        const [, prefix, goSourceUrl] = sourceMatch;
        if (!goModule.startsWith(prefix)) {
            logger_1.logger.trace({ goModule }, 'go-source header prefix not match');
            return null;
        }
        logger_1.logger.debug({ goModule, goSourceUrl }, 'Go lookup source url');
        if (goSourceUrl === null || goSourceUrl === void 0 ? void 0 : goSourceUrl.startsWith('https://github.com/')) {
            return {
                datasource: github.id,
                lookupName: goSourceUrl
                    .replace('https://github.com/', '')
                    .replace(/\/$/, ''),
            };
        }
        if (goSourceUrl === null || goSourceUrl === void 0 ? void 0 : goSourceUrl.match('^https://[^/]*gitlab.[^/]*/.+')) {
            const gitlabRegExp = /^(https:\/\/[^/]*gitlab.[^/]*)\/(.*)$/;
            const gitlabRes = gitlabRegExp.exec(goSourceUrl);
            return {
                datasource: gitlab.id,
                registryUrl: gitlabRes[1],
                lookupName: gitlabRes[2].replace(/\/$/, ''),
            };
        }
    }
    else {
        logger_1.logger.trace({ goModule }, 'No go-source header found');
    }
    return null;
}
/**
 * go.getReleases
 *
 * This datasource resolves a go module URL into its source repository
 *  and then fetch it if it is on GitHub.
 *
 * This function will:
 *  - Determine the source URL for the module
 *  - Call the respective getReleases in github/gitlab to retrieve the tags
 *  - Filter module tags according to the module path
 */
async function getReleases({ lookupName, }) {
    logger_1.logger.trace(`go.getReleases(${lookupName})`);
    const source = await getDatasource(lookupName);
    if ((source === null || source === void 0 ? void 0 : source.datasource) !== github.id && (source === null || source === void 0 ? void 0 : source.datasource) !== gitlab.id) {
        return null;
    }
    const res = source.datasource === github.id
        ? await github.getReleases(source)
        : await gitlab.getReleases(source);
    // istanbul ignore if
    if (!res) {
        return res;
    }
    /**
     * github.com/org/mod/submodule should be tagged as submodule/va.b.c
     * and that tag should be used instead of just va.b.c, although for compatibility
     * the old behaviour stays the same.
     */
    const nameParts = lookupName.split('/');
    logger_1.logger.trace({ nameParts, releases: res.releases }, 'go.getReleases');
    if (nameParts.length > 3) {
        const prefix = nameParts.slice(3, nameParts.length).join('/');
        logger_1.logger.trace(`go.getReleases.prefix:${prefix}`);
        const submodReleases = res.releases
            .filter((release) => { var _a; return (_a = release.version) === null || _a === void 0 ? void 0 : _a.startsWith(prefix); })
            .map((release) => {
            const r2 = release;
            r2.version = r2.version.replace(`${prefix}/`, '');
            return r2;
        });
        logger_1.logger.trace({ submodReleases }, 'go.getReleases');
        if (submodReleases.length > 0) {
            res.releases = submodReleases;
            return res;
        }
    }
    if (res === null || res === void 0 ? void 0 : res.releases) {
        res.releases = res.releases.filter((release) => { var _a; return (_a = release.version) === null || _a === void 0 ? void 0 : _a.startsWith('v'); });
    }
    return res;
}
exports.getReleases = getReleases;
/**
 * go.getDigest
 *
 * This datasource resolves a go module URL into its source repository
 *  and then fetches the digest it if it is on GitHub.
 *
 * This function will:
 *  - Determine the source URL for the module
 *  - Call the respective getDigest in github to retrieve the commit hash
 */
async function getDigest({ lookupName }, value) {
    const source = await getDatasource(lookupName);
    if (source && source.datasource === github.id) {
        // ignore v0.0.0- pseudo versions that are used Go Modules - look up default branch instead
        const tag = value && !value.startsWith('v0.0.0-2') ? value : undefined;
        const digest = await github.getDigest(source, tag);
        return digest;
    }
    return null;
}
exports.getDigest = getDigest;
//# sourceMappingURL=index.js.map