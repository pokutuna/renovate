"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.RegExpVersioningApi = exports.supportsRanges = exports.urls = exports.displayName = exports.id = void 0;
const semver_1 = require("semver");
const error_messages_1 = require("../../constants/error-messages");
const regex_1 = require("../../util/regex");
const generic_1 = require("../loose/generic");
exports.id = 'regex';
exports.displayName = 'Regular Expression';
exports.urls = [];
exports.supportsRanges = false;
// convenience method for passing a Version object into any semver.* method.
function asSemver(version) {
    let vstring = `${version.release[0]}.${version.release[1]}.${version.release[2]}`;
    if (typeof version.prerelease !== 'undefined') {
        vstring += `-${version.prerelease}`;
    }
    return vstring;
}
class RegExpVersioningApi extends generic_1.GenericVersioningApi {
    constructor(new_config) {
        super();
        // config is expected to be overridden by a user-specified RegExp value
        // sample values:
        //
        // * emulates the "semver" configuration:
        //   RegExp('^(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)(-(?<prerelease>.*))?$')
        // * emulates the "docker" configuration:
        //   RegExp('^(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)(-(?<compatibility>.*))?$')
        // * matches the versioning approach used by the Python images on DockerHub:
        //   RegExp('^(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)(?<prerelease>[^.-]+)?(-(?<compatibility>.*))?$');
        this._config = null;
        if (!new_config) {
            // eslint-disable-next-line no-param-reassign
            new_config = '^(?<major>\\d+)?$';
        }
        // without at least one of {major, minor, patch} specified in the regex,
        // this versioner will not work properly
        if (!new_config.includes('<major>') &&
            !new_config.includes('<minor>') &&
            !new_config.includes('<patch>')) {
            const error = new Error(error_messages_1.CONFIG_VALIDATION);
            error.configFile = new_config;
            error.validationError =
                'regex versioning needs at least one major, minor or patch group defined';
            throw error;
        }
        // TODO: should we validate the user has not added extra unsupported
        // capture groups?
        this._config = regex_1.regEx(new_config);
    }
    _compare(version, other) {
        return semver_1.compare(asSemver(this._parse(version)), asSemver(this._parse(other)));
    }
    // convenience method for passing a string into a Version given current config.
    _parse(version) {
        const match = this._config.exec(version);
        if (match === null) {
            return null;
        }
        const groups = match.groups;
        return {
            release: [
                typeof groups.major === 'undefined' ? 0 : Number(groups.major),
                typeof groups.minor === 'undefined' ? 0 : Number(groups.minor),
                typeof groups.patch === 'undefined' ? 0 : Number(groups.patch),
            ],
            prerelease: groups.prerelease,
            compatibility: groups.compatibility,
        };
    }
    isCompatible(version, range) {
        return (this._parse(version).compatibility === this._parse(range).compatibility);
    }
    isStable(version) {
        return typeof this._parse(version).prerelease === 'undefined';
    }
    isLessThanRange(version, range) {
        return semver_1.ltr(asSemver(this._parse(version)), asSemver(this._parse(range)));
    }
    maxSatisfyingVersion(versions, range) {
        return semver_1.maxSatisfying(versions.map((v) => asSemver(this._parse(v))), asSemver(this._parse(range)));
    }
    minSatisfyingVersion(versions, range) {
        return semver_1.minSatisfying(versions.map((v) => asSemver(this._parse(v))), asSemver(this._parse(range)));
    }
    matches(version, range) {
        return semver_1.satisfies(asSemver(this._parse(version)), asSemver(this._parse(range)));
    }
}
exports.RegExpVersioningApi = RegExpVersioningApi;
exports.api = RegExpVersioningApi;
exports.default = exports.api;
//# sourceMappingURL=index.js.map