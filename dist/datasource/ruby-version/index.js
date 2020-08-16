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
exports.getReleases = exports.id = void 0;
const node_html_parser_1 = require("node-html-parser");
const external_host_error_1 = require("../../types/errors/external-host-error");
const packageCache = __importStar(require("../../util/cache/package"));
const http_1 = require("../../util/http");
const ruby_1 = require("../../versioning/ruby");
exports.id = 'ruby-version';
const http = new http_1.Http(exports.id);
const rubyVersionsUrl = 'https://www.ruby-lang.org/en/downloads/releases/';
async function getReleases(_config) {
    // First check the persistent cache
    const cacheNamespace = 'datasource-ruby-version';
    const cachedResult = await packageCache.get(cacheNamespace, 'all');
    // istanbul ignore if
    if (cachedResult) {
        return cachedResult;
    }
    try {
        const res = {
            homepage: 'https://www.ruby-lang.org',
            sourceUrl: 'https://github.com/ruby/ruby',
            releases: [],
        };
        const response = await http.get(rubyVersionsUrl);
        const root = node_html_parser_1.parse(response.body);
        const rows = root.querySelector('.release-list').querySelectorAll('tr');
        for (const row of rows) {
            const columns = Array.from(row.querySelectorAll('td').map((td) => td.innerHTML));
            if (columns.length) {
                const version = columns[0].replace('Ruby ', '');
                if (ruby_1.isVersion(version)) {
                    const releaseTimestamp = columns[1];
                    const changelogUrl = columns[2]
                        .replace('<a href="', 'https://www.ruby-lang.org')
                        .replace('">more...</a>', '');
                    res.releases.push({ version, releaseTimestamp, changelogUrl });
                }
            }
        }
        await packageCache.set(cacheNamespace, 'all', res, 15);
        return res;
    }
    catch (err) {
        throw new external_host_error_1.ExternalHostError(err);
    }
}
exports.getReleases = getReleases;
//# sourceMappingURL=index.js.map