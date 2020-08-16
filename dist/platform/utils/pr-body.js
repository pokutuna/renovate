"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartTruncate = void 0;
const re = new RegExp(`### Release Notes.*### Renovate configuration`, 'ms');
function smartTruncate(input, len) {
    if (input.length < len) {
        return input;
    }
    const releaseNotesMatch = re.exec(input);
    if (releaseNotesMatch) {
        const divider = `</details>\n\n---\n\n### Renovate configuration`;
        const [releaseNotes] = releaseNotesMatch;
        const nonReleaseNotesLength = input.length - releaseNotes.length - divider.length;
        const availableLength = len - nonReleaseNotesLength;
        if (availableLength <= 0) {
            return input.substring(0, len);
        }
        return input.replace(releaseNotes, releaseNotes.slice(0, availableLength) + divider);
    }
    return input.substring(0, len);
}
exports.smartTruncate = smartTruncate;
//# sourceMappingURL=pr-body.js.map