"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mightBeABrowserLibrary = void 0;
function mightBeABrowserLibrary(packageJson) {
    // return true unless we're sure it's not a browser library
    if (packageJson.private === true) {
        // it's not published
        return false;
    }
    if (packageJson.main === undefined) {
        // it can't be required
        return false;
    }
    // TODO: how can we know if it's a node.js library only, and not browser?
    // Otherwise play it safe and return true
    return true;
}
exports.mightBeABrowserLibrary = mightBeABrowserLibrary;
//# sourceMappingURL=type.js.map