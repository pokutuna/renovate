"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = void 0;
const get_1 = require("./get");
const get_rubygems_org_1 = require("./get-rubygems-org");
function getReleases({ lookupName, registryUrl, }) {
    // prettier-ignore
    if (registryUrl.endsWith('rubygems.org')) { // lgtm [js/incomplete-url-substring-sanitization]
        return get_rubygems_org_1.getRubygemsOrgDependency(lookupName);
    }
    return get_1.getDependency({ dependency: lookupName, registry: registryUrl });
}
exports.getReleases = getReleases;
//# sourceMappingURL=releases.js.map