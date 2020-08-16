"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = void 0;
const xmldoc_1 = require("xmldoc");
const logger_1 = require("../../logger");
const http_1 = require("../../util/http");
const common_1 = require("./common");
const http = new http_1.Http(common_1.id);
function getPkgProp(pkgInfo, propName) {
    var _a;
    return (_a = pkgInfo.childNamed('m:properties').childNamed(`d:${propName}`)) === null || _a === void 0 ? void 0 : _a.val;
}
async function getReleases(feedUrl, pkgName) {
    const dep = {
        pkgName,
        releases: [],
    };
    let pkgUrlList = `${feedUrl.replace(/\/+$/, '')}/FindPackagesById()?id=%27${pkgName}%27&$select=Version,IsLatestVersion,ProjectUrl,Published`;
    do {
        const pkgVersionsListRaw = await http.get(pkgUrlList);
        const pkgVersionsListDoc = new xmldoc_1.XmlDocument(pkgVersionsListRaw.body);
        const pkgInfoList = pkgVersionsListDoc.childrenNamed('entry');
        for (const pkgInfo of pkgInfoList) {
            const version = getPkgProp(pkgInfo, 'Version');
            const releaseTimestamp = getPkgProp(pkgInfo, 'Published');
            dep.releases.push({ version, releaseTimestamp });
            try {
                const pkgIsLatestVersion = getPkgProp(pkgInfo, 'IsLatestVersion');
                if (pkgIsLatestVersion === 'true') {
                    const projectUrl = getPkgProp(pkgInfo, 'ProjectUrl');
                    if (projectUrl) {
                        dep.sourceUrl = projectUrl;
                    }
                }
            }
            catch (err) /* istanbul ignore next */ {
                logger_1.logger.debug({ err, pkgName, feedUrl }, `nuget registry failure: can't parse pkg info for project url`);
            }
        }
        const nextPkgUrlListLink = pkgVersionsListDoc
            .childrenNamed('link')
            .find((node) => node.attr.rel === 'next');
        pkgUrlList = nextPkgUrlListLink ? nextPkgUrlListLink.attr.href : null;
    } while (pkgUrlList !== null);
    // dep not found if no release, so we can try next registry
    if (dep.releases.length === 0) {
        return null;
    }
    return dep;
}
exports.getReleases = getReleases;
//# sourceMappingURL=v2.js.map