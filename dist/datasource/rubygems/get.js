"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependency = void 0;
const logger_1 = require("../../logger");
const http_1 = require("../../util/http");
const url_1 = require("../../util/url");
const common_1 = require("./common");
const http = new http_1.Http(common_1.id);
const INFO_PATH = '/api/v1/gems';
const VERSIONS_PATH = '/api/v1/versions';
const getHeaders = () => {
    return { hostType: common_1.id };
};
const fetch = async ({ dependency, registry, path }) => {
    const headers = getHeaders();
    const name = `${path}/${dependency}.json`;
    const baseUrl = url_1.ensureTrailingSlash(registry);
    logger_1.logger.trace({ dependency }, `RubyGems lookup request: ${baseUrl} ${name}`);
    const response = (await http.getJson(name, { baseUrl, headers })) || {
        body: undefined,
    };
    return response.body;
};
exports.getDependency = async ({ dependency, registry, }) => {
    logger_1.logger.debug({ dependency }, 'RubyGems lookup for dependency');
    const info = await fetch({ dependency, registry, path: INFO_PATH });
    if (!info) {
        logger_1.logger.debug({ dependency }, 'RubyGems package not found.');
        return null;
    }
    if (dependency.toLowerCase() !== info.name.toLowerCase()) {
        logger_1.logger.warn({ lookup: dependency, returned: info.name }, 'Lookup name does not match with returned.');
        return null;
    }
    const versions = (await fetch({ dependency, registry, path: VERSIONS_PATH })) || [];
    const releases = versions.map(({ number: version, platform: rubyPlatform, created_at: releaseTimestamp, rubygems_version: rubygemsVersion, ruby_version: rubyVersion, }) => ({
        version,
        rubyPlatform,
        releaseTimestamp,
        rubygemsVersion,
        rubyVersion,
    }));
    return {
        releases,
        homepage: info.homepage_uri,
        sourceUrl: info.source_code_uri,
        changelogUrl: info.changelog_uri,
    };
};
//# sourceMappingURL=get.js.map