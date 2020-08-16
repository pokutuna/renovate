"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIndexDir = exports.SBT_PLUGINS_REPO = void 0;
exports.SBT_PLUGINS_REPO = 'https://dl.bintray.com/sbt/sbt-plugin-releases';
function parseIndexDir(content, filterFn = (x) => !/^\.+/.test(x)) {
    const unfiltered = content.match(/(?<=href=['"])[^'"]*(?=\/['"])/g) || [];
    return unfiltered.filter(filterFn);
}
exports.parseIndexDir = parseIndexDir;
//# sourceMappingURL=util.js.map