"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNKNOWN_ERROR = exports.BUNDLER_INVALID_CREDENTIALS = exports.WORKER_FILE_UPDATE_FAILED = exports.HOST_DISABLED = exports.IGNORABLE_HOST_ERROR = exports.EXTERNAL_HOST_ERROR = exports.MANAGER_NO_PACKAGE_FILES = exports.MANAGER_LOCKFILE_ERROR = exports.REPOSITORY_UNINITIATED = exports.REPOSITORY_TEMPORARY_ERROR = exports.REPOSITORY_RENAMED = exports.REPOSITORY_NO_VULNERABILITY = exports.REPOSITORY_NOT_FOUND = exports.REPOSITORY_MIRRORED = exports.REPOSITORY_FORKED = exports.REPOSITORY_EMPTY = exports.REPOSITORY_DISABLED = exports.REPOSITORY_CHANGED = exports.REPOSITORY_CANNOT_FORK = exports.REPOSITORY_BLOCKED = exports.REPOSITORY_ARCHIVED = exports.REPOSITORY_ACCESS_FORBIDDEN = exports.CONFIG_SECRETS_EXPOSED = exports.CONFIG_VALIDATION = exports.PLATFORM_RATE_LIMIT_EXCEEDED = exports.PLATFORM_NOT_FOUND = exports.PLATFORM_INTEGRATION_UNAUTHORIZED = exports.PLATFORM_GPG_FAILED = exports.PLATFORM_BAD_CREDENTIALS = exports.PLATFORM_AUTHENTICATION_ERROR = exports.SYSTEM_INSUFFICIENT_MEMORY = exports.SYSTEM_INSUFFICIENT_DISK_SPACE = void 0;
// System error
exports.SYSTEM_INSUFFICIENT_DISK_SPACE = 'disk-space';
exports.SYSTEM_INSUFFICIENT_MEMORY = 'out-of-memory';
// Platform Error
exports.PLATFORM_AUTHENTICATION_ERROR = 'authentication-error';
exports.PLATFORM_BAD_CREDENTIALS = 'bad-credentials';
exports.PLATFORM_GPG_FAILED = 'gpg-failed';
exports.PLATFORM_INTEGRATION_UNAUTHORIZED = 'integration-unauthorized';
exports.PLATFORM_NOT_FOUND = 'platform-not-found';
exports.PLATFORM_RATE_LIMIT_EXCEEDED = 'rate-limit-exceeded';
// Config Error
exports.CONFIG_VALIDATION = 'config-validation';
exports.CONFIG_SECRETS_EXPOSED = 'config-secrets-exposed';
// Repository Error
exports.REPOSITORY_ACCESS_FORBIDDEN = 'forbidden';
exports.REPOSITORY_ARCHIVED = 'archived';
exports.REPOSITORY_BLOCKED = 'blocked';
exports.REPOSITORY_CANNOT_FORK = 'cannot-fork';
exports.REPOSITORY_CHANGED = 'repository-changed';
exports.REPOSITORY_DISABLED = 'disabled';
exports.REPOSITORY_EMPTY = 'empty';
exports.REPOSITORY_FORKED = 'fork';
exports.REPOSITORY_MIRRORED = 'mirror';
exports.REPOSITORY_NOT_FOUND = 'not-found';
exports.REPOSITORY_NO_VULNERABILITY = 'no-vulnerability-alerts';
exports.REPOSITORY_RENAMED = 'renamed';
exports.REPOSITORY_TEMPORARY_ERROR = 'temporary-error';
exports.REPOSITORY_UNINITIATED = 'uninitiated';
// Manager Error
exports.MANAGER_LOCKFILE_ERROR = 'lockfile-error';
exports.MANAGER_NO_PACKAGE_FILES = 'no-package-files';
// Host error
exports.EXTERNAL_HOST_ERROR = 'external-host-error';
exports.IGNORABLE_HOST_ERROR = 'ignorable-host-error';
exports.HOST_DISABLED = 'host-disabled';
// Worker Error
exports.WORKER_FILE_UPDATE_FAILED = 'update-failure';
// Bundler Error
exports.BUNDLER_INVALID_CREDENTIALS = 'bundler-credentials';
// Unknown Error
exports.UNKNOWN_ERROR = 'unknown-error';
//# sourceMappingURL=error-messages.js.map