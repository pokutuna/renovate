"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHttpResourceExists = exports.downloadHttpProtocol = void 0;
const url_1 = __importDefault(require("url"));
const error_messages_1 = require("../../constants/error-messages");
const logger_1 = require("../../logger");
const external_host_error_1 = require("../../types/errors/external-host-error");
const http_1 = require("../../util/http");
const common_1 = require("./common");
const http = {};
function httpByHostType(hostType) {
    if (!http[hostType]) {
        http[hostType] = new http_1.Http(hostType);
    }
    return http[hostType];
}
const getHost = (x) => new url_1.default.URL(x).host;
function isMavenCentral(pkgUrl) {
    const host = typeof pkgUrl === 'string' ? pkgUrl : pkgUrl.host;
    return getHost(common_1.MAVEN_REPO) === host;
}
function isTemporalError(err) {
    return (err.code === 'ECONNRESET' ||
        err.statusCode === 429 ||
        (err.statusCode >= 500 && err.statusCode < 600));
}
function isHostError(err) {
    return err.code === 'ETIMEDOUT';
}
function isNotFoundError(err) {
    return err.code === 'ENOTFOUND' || err.statusCode === 404;
}
function isPermissionsIssue(err) {
    return err.statusCode === 401 || err.statusCode === 403;
}
function isConnectionError(err) {
    return (err.code === 'EAI_AGAIN' ||
        err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
        err.code === 'ECONNREFUSED');
}
function isUnsupportedHostError(err) {
    return err.name === 'UnsupportedProtocolError';
}
async function downloadHttpProtocol(pkgUrl, hostType = common_1.id) {
    let raw;
    try {
        const httpClient = httpByHostType(hostType);
        raw = await httpClient.get(pkgUrl.toString());
        return raw.body;
    }
    catch (err) {
        const failedUrl = pkgUrl.toString();
        if (err.message === error_messages_1.HOST_DISABLED) {
            // istanbul ignore next
            logger_1.logger.trace({ failedUrl }, 'Host disabled');
        }
        else if (isNotFoundError(err)) {
            logger_1.logger.trace({ failedUrl }, `Url not found`);
        }
        else if (isHostError(err)) {
            // istanbul ignore next
            logger_1.logger.debug({ failedUrl }, `Cannot connect to ${hostType} host`);
        }
        else if (isPermissionsIssue(err)) {
            logger_1.logger.debug({ failedUrl }, 'Dependency lookup unauthorized. Please add authentication with a hostRule');
        }
        else if (isTemporalError(err)) {
            logger_1.logger.debug({ failedUrl, err }, 'Temporary error');
            if (isMavenCentral(pkgUrl)) {
                throw new external_host_error_1.ExternalHostError(err);
            }
        }
        else if (isConnectionError(err)) {
            // istanbul ignore next
            logger_1.logger.debug({ failedUrl }, 'Connection refused to maven registry');
        }
        else if (isUnsupportedHostError(err)) {
            // istanbul ignore next
            logger_1.logger.debug({ failedUrl }, 'Unsupported host');
        }
        else {
            logger_1.logger.info({ failedUrl, err }, 'Unknown error');
        }
        return null;
    }
}
exports.downloadHttpProtocol = downloadHttpProtocol;
async function isHttpResourceExists(pkgUrl, hostType = common_1.id) {
    try {
        const httpClient = httpByHostType(hostType);
        await httpClient.head(pkgUrl.toString());
        return true;
    }
    catch (err) {
        if (isNotFoundError(err)) {
            return false;
        }
        const failedUrl = pkgUrl.toString();
        logger_1.logger.debug({ failedUrl }, `Can't check HTTP resource existence`);
        return null;
    }
}
exports.isHttpResourceExists = isHttpResourceExists;
//# sourceMappingURL=util.js.map