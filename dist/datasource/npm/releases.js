"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleases = void 0;
const get_1 = require("./get");
const npmrc_1 = require("./npmrc");
async function getReleases({ lookupName, npmrc, }) {
    if (npmrc) {
        npmrc_1.setNpmrc(npmrc);
    }
    const res = await get_1.getDependency(lookupName);
    if (res) {
        res.tags = res['dist-tags'];
        delete res['dist-tags'];
        delete res['renovate-config'];
    }
    return res;
}
exports.getReleases = getReleases;
//# sourceMappingURL=releases.js.map