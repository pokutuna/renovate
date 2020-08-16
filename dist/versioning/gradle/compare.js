"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValid = exports.parseMavenBasedRange = exports.parsePrefixRange = exports.RangeBound = exports.isVersion = exports.compare = exports.qualifierRank = exports.QualifierRank = exports.tokenize = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Number"] = 1] = "Number";
    TokenType[TokenType["String"] = 2] = "String";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
function iterateChars(str, cb) {
    let prev = null;
    let next = null;
    for (let i = 0; i < str.length; i += 1) {
        next = str.charAt(i);
        cb(prev, next);
        prev = next;
    }
    cb(prev, null);
}
function isSeparator(char) {
    return /^[-._+]$/i.test(char);
}
function isDigit(char) {
    return /^\d$/.test(char);
}
function isLetter(char) {
    return !isSeparator(char) && !isDigit(char);
}
function isTransition(prevChar, nextChar) {
    return ((isDigit(prevChar) && isLetter(nextChar)) ||
        (isLetter(prevChar) && isDigit(nextChar)));
}
function tokenize(versionStr) {
    let result = [];
    let currentVal = '';
    function yieldToken() {
        if (currentVal === '') {
            result = null;
        }
        if (result) {
            const val = currentVal;
            if (/^\d+$/.test(val)) {
                result.push({
                    type: TokenType.Number,
                    val: parseInt(val, 10),
                });
            }
            else {
                result.push({
                    type: TokenType.String,
                    val,
                });
            }
        }
    }
    iterateChars(versionStr, (prevChar, nextChar) => {
        if (nextChar === null) {
            yieldToken();
        }
        else if (isSeparator(nextChar)) {
            yieldToken();
            currentVal = '';
        }
        else if (prevChar !== null && isTransition(prevChar, nextChar)) {
            yieldToken();
            currentVal = nextChar;
        }
        else {
            currentVal = currentVal.concat(nextChar);
        }
    });
    return result;
}
exports.tokenize = tokenize;
var QualifierRank;
(function (QualifierRank) {
    QualifierRank[QualifierRank["Dev"] = -1] = "Dev";
    QualifierRank[QualifierRank["Default"] = 0] = "Default";
    QualifierRank[QualifierRank["RC"] = 1] = "RC";
    QualifierRank[QualifierRank["Release"] = 2] = "Release";
    QualifierRank[QualifierRank["Final"] = 3] = "Final";
})(QualifierRank = exports.QualifierRank || (exports.QualifierRank = {}));
function qualifierRank(input) {
    const val = input.toLowerCase();
    if (val === 'dev') {
        return QualifierRank.Dev;
    }
    if (val === 'rc' || val === 'cr') {
        return QualifierRank.RC;
    }
    if (val === 'ga' || val === 'release' || val === 'latest' || val === 'sr') {
        return QualifierRank.Release;
    }
    if (val === 'final') {
        return QualifierRank.Final;
    }
    return QualifierRank.Default;
}
exports.qualifierRank = qualifierRank;
function stringTokenCmp(left, right) {
    const leftRank = qualifierRank(left);
    const rightRank = qualifierRank(right);
    if (leftRank === 0 && rightRank === 0) {
        if (left === 'SNAPSHOT' || right === 'SNAPSHOT') {
            if (left.toLowerCase() < right.toLowerCase()) {
                return -1;
            }
            if (left.toLowerCase() > right.toLowerCase()) {
                return 1;
            }
        }
        else {
            if (left < right) {
                return -1;
            }
            if (left > right) {
                return 1;
            }
        }
    }
    else {
        if (leftRank < rightRank) {
            return -1;
        }
        if (leftRank > rightRank) {
            return 1;
        }
    }
    return 0;
}
function tokenCmp(left, right) {
    if (left === null) {
        if (right.type === TokenType.String) {
            return 1;
        }
        return -1;
    }
    if (right === null) {
        if (left.type === TokenType.String) {
            return -1;
        }
        return 1;
    }
    if (left.type === TokenType.Number && right.type === TokenType.Number) {
        if (left.val < right.val) {
            return -1;
        }
        if (left.val > right.val) {
            return 1;
        }
    }
    else if (typeof left.val === 'string' && typeof right.val === 'string') {
        return stringTokenCmp(left.val, right.val);
    }
    else if (right.type === TokenType.Number) {
        return -1;
    }
    else if (left.type === TokenType.Number) {
        return 1;
    }
    return 0;
}
function compare(left, right) {
    const leftTokens = tokenize(left);
    const rightTokens = tokenize(right);
    const length = Math.max(leftTokens.length, rightTokens.length);
    for (let idx = 0; idx < length; idx += 1) {
        const leftToken = leftTokens[idx] || null;
        const rightToken = rightTokens[idx] || null;
        const cmpResult = tokenCmp(leftToken, rightToken);
        if (cmpResult !== 0) {
            return cmpResult;
        }
    }
    return 0;
}
exports.compare = compare;
function isVersion(input) {
    if (!input) {
        return false;
    }
    if (!/^[-._+a-zA-Z0-9]+$/i.test(input)) {
        return false;
    }
    if (/^latest\.?/i.test(input)) {
        return false;
    }
    const tokens = tokenize(input);
    return !!tokens && !!tokens.length;
}
exports.isVersion = isVersion;
var RangeBound;
(function (RangeBound) {
    RangeBound[RangeBound["Inclusive"] = 1] = "Inclusive";
    RangeBound[RangeBound["Exclusive"] = 2] = "Exclusive";
})(RangeBound = exports.RangeBound || (exports.RangeBound = {}));
function parsePrefixRange(input) {
    if (!input) {
        return null;
    }
    if (input.trim() === '+') {
        return { tokens: [] };
    }
    const postfixRegex = /[-._]\+$/;
    if (postfixRegex.test(input)) {
        const prefixValue = input.replace(/[-._]\+$/, '');
        const tokens = tokenize(prefixValue);
        return tokens ? { tokens } : null;
    }
    return null;
}
exports.parsePrefixRange = parsePrefixRange;
const mavenBasedRangeRegex = /^(?<leftBoundStr>[[\](]\s*)(?<leftVal>[-._+a-zA-Z0-9]*?)(?<separator>\s*,\s*)(?<rightVal>[-._+a-zA-Z0-9]*?)(?<rightBoundStr>\s*[[\])])$/;
function parseMavenBasedRange(input) {
    if (!input) {
        return null;
    }
    const match = mavenBasedRangeRegex.exec(input);
    if (match) {
        const { leftBoundStr, separator, rightBoundStr } = match.groups;
        let { leftVal, rightVal } = match.groups;
        if (!leftVal) {
            leftVal = null;
        }
        if (!rightVal) {
            rightVal = null;
        }
        const isVersionLeft = isVersion(leftVal);
        const isVersionRight = isVersion(rightVal);
        if ((leftVal === null || isVersionLeft) &&
            (rightVal === null || isVersionRight)) {
            if (isVersionLeft && isVersionRight && compare(leftVal, rightVal) === 1) {
                return null;
            }
            const leftBound = leftBoundStr.trim() === '['
                ? RangeBound.Inclusive
                : RangeBound.Exclusive;
            const rightBound = rightBoundStr.trim() === ']'
                ? RangeBound.Inclusive
                : RangeBound.Exclusive;
            return {
                leftBound,
                leftBoundStr,
                leftVal,
                separator,
                rightBound,
                rightBoundStr,
                rightVal,
            };
        }
    }
    return null;
}
exports.parseMavenBasedRange = parseMavenBasedRange;
function isValid(str) {
    if (!str) {
        return false;
    }
    return (isVersion(str) || !!parsePrefixRange(str) || !!parseMavenBasedRange(str));
}
exports.isValid = isValid;
//# sourceMappingURL=compare.js.map