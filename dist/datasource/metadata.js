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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMetaData = void 0;
const url_1 = __importDefault(require("url"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const github_url_from_git_1 = __importDefault(require("github-url-from-git"));
const hostRules = __importStar(require("../util/host-rules"));
// Use this object to define changelog URLs for packages
// Only necessary when the changelog data cannot be found in the package's source repository
const manualChangelogUrls = {
    npm: {
        'babel-preset-react-app': 'https://github.com/facebook/create-react-app/releases',
        firebase: 'https://firebase.google.com/support/release-notes/js',
        'flow-bin': 'https://github.com/facebook/flow/blob/master/Changelog.md',
        gatsby: 'https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/CHANGELOG.md',
        'react-native': 'https://github.com/react-native-community/react-native-releases/blob/master/CHANGELOG.md',
    },
    pypi: {
        django: 'https://github.com/django/django/tree/master/docs/releases',
        djangorestframework: 'https://www.django-rest-framework.org/community/release-notes/',
        flake8: 'http://flake8.pycqa.org/en/latest/release-notes/index.html',
        'django-storages': 'https://github.com/jschneier/django-storages/blob/master/CHANGELOG.rst',
        phonenumbers: 'https://github.com/daviddrysdale/python-phonenumbers/blob/dev/python/HISTORY.md',
        'psycopg2-binary': 'http://initd.org/psycopg/articles/tag/release/',
        'django-debug-toolbar': 'https://django-debug-toolbar.readthedocs.io/en/latest/changes.html',
        'firebase-admin': 'https://firebase.google.com/support/release-notes/admin/python',
        requests: 'https://github.com/psf/requests/blob/master/HISTORY.md',
        wagtail: 'https://github.com/wagtail/wagtail/tree/master/docs/releases',
    },
    docker: {
        'gitlab/gitlab-ce': 'https://gitlab.com/gitlab-org/omnibus-gitlab/-/blob/master/CHANGELOG.md',
        'gitlab/gitlab-runner': 'https://gitlab.com/gitlab-org/gitlab-runner/-/blob/master/CHANGELOG.md',
    },
};
// Use this object to define manual source URLs for packages
// Only necessary if the datasource is unable to locate the source URL itself
const manualSourceUrls = {
    orb: {
        'cypress-io/cypress': 'https://github.com/cypress-io/circleci-orb',
        'hutson/library-release-workflows': 'https://github.com/hyper-expanse/library-release-workflows',
    },
    docker: {
        'gcr.io/kaniko-project/executor': 'https://github.com/GoogleContainerTools/kaniko',
        'gitlab/gitlab-ce': 'https://gitlab.com/gitlab-org/omnibus-gitlab',
        'gitlab/gitlab-runner': 'https://gitlab.com/gitlab-org/gitlab-runner',
        node: 'https://github.com/nodejs/node',
        traefik: 'https://github.com/containous/traefik',
    },
    kubernetes: {
        node: 'https://github.com/nodejs/node',
    },
    npm: {
        node: 'https://github.com/nodejs/node',
    },
    nvm: {
        node: 'https://github.com/nodejs/node',
    },
    pypi: {
        mkdocs: 'https://github.com/mkdocs/mkdocs',
        mypy: 'https://github.com/python/mypy',
    },
};
/* eslint-disable no-param-reassign */
function addMetaData(dep, datasource, lookupName) {
    var _a, _b, _c, _d;
    if (!dep) {
        return;
    }
    const lookupNameLowercase = lookupName ? lookupName.toLowerCase() : null;
    if ((_a = manualChangelogUrls[datasource]) === null || _a === void 0 ? void 0 : _a[lookupNameLowercase]) {
        dep.changelogUrl = manualChangelogUrls[datasource][lookupNameLowercase];
    }
    if ((_b = manualSourceUrls[datasource]) === null || _b === void 0 ? void 0 : _b[lookupNameLowercase]) {
        dep.sourceUrl = manualSourceUrls[datasource][lookupNameLowercase];
    }
    /**
     * @param {string} url
     */
    const massageGithubUrl = (url) => {
        return url
            .replace('http:', 'https:')
            .replace(/^git:\/?\/?/, 'https://')
            .replace('www.github.com', 'github.com')
            .split('/')
            .slice(0, 5)
            .join('/');
    };
    /**
     * @param {string} url
     */
    const massageGitlabUrl = (url) => {
        return url
            .replace('http:', 'https:')
            .replace(/^git:\/?\/?/, 'https://')
            .replace(/\/tree\/.*$/i, '')
            .replace(/\/$/i, '')
            .replace('.git', '');
    };
    if (((_c = dep.changelogUrl) === null || _c === void 0 ? void 0 : _c.includes('github.com')) && // lgtm [js/incomplete-url-substring-sanitization]
        !dep.sourceUrl) {
        dep.sourceUrl = dep.changelogUrl;
    }
    // prettier-ignore
    if ((_d = dep.homepage) === null || _d === void 0 ? void 0 : _d.includes('github.com')) { // lgtm [js/incomplete-url-substring-sanitization]
        if (!dep.sourceUrl) {
            dep.sourceUrl = dep.homepage;
        }
        delete dep.homepage;
    }
    const extraBaseUrls = [];
    // istanbul ignore next
    hostRules.hosts({ hostType: 'github' }).forEach((host) => {
        extraBaseUrls.push(host, `gist.${host}`);
    });
    extraBaseUrls.push('gitlab.com');
    if (dep.sourceUrl) {
        const parsedUrl = url_1.default.parse(dep.sourceUrl);
        if (parsedUrl === null || parsedUrl === void 0 ? void 0 : parsedUrl.hostname) {
            let massagedUrl;
            if (parsedUrl.hostname.includes('gitlab')) {
                massagedUrl = massageGitlabUrl(dep.sourceUrl);
            }
            else {
                massagedUrl = massageGithubUrl(dep.sourceUrl);
            }
            // try massaging it
            dep.sourceUrl =
                github_url_from_git_1.default(massagedUrl, {
                    extraBaseUrls,
                }) || dep.sourceUrl;
        }
        else {
            delete dep.sourceUrl;
        }
    }
    // Clean up any empty urls
    const urls = ['homepage', 'sourceUrl', 'changelogUrl'];
    for (const url of urls) {
        if (is_1.default.nonEmptyString(dep[url])) {
            dep[url] = dep[url].trim();
            // istanbul ignore if
            if (!dep[url].match(/^https?:\/\//)) {
                delete dep[url];
            }
        }
        else {
            delete dep[url];
        }
    }
}
exports.addMetaData = addMetaData;
//# sourceMappingURL=metadata.js.map