"use strict";

const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const bluebird_1 = require("bluebird");
const readInstalled = require("read-installed");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
// we use relative path to avoid canonical path issue - e.g. /tmp vs /private/tmp
function copyFiltered(src, destination, filter, dereference) {
    return fs_extra_p_1.copy(src, destination, {
        dereference: dereference,
        filter: filter,
        passStats: true
    });
}
exports.copyFiltered = copyFiltered;
function hasMagic(pattern) {
    const set = pattern.set;
    if (set.length > 1) {
        return true;
    }
    for (let i of set[0]) {
        if (typeof i !== "string") {
            return true;
        }
    }
    return false;
}
exports.hasMagic = hasMagic;
function createFilter(src, patterns, ignoreFiles, rawFilter, excludePatterns) {
    return function filter(it, stat) {
        if (src === it) {
            return true;
        }
        if (rawFilter != null && !rawFilter(it)) {
            return false;
        }
        // yes, check before path sep normalization
        if (ignoreFiles != null && ignoreFiles.has(it)) {
            return false;
        }
        let relative = it.substring(src.length + 1);
        if (path.sep === "\\") {
            relative = relative.replace(/\\/g, "/");
        }
        return minimatchAll(relative, patterns, stat) && (excludePatterns == null || !minimatchAll(relative, excludePatterns, stat));
    };
}
exports.createFilter = createFilter;
function devDependencies(dir) {
    return new bluebird_1.Promise((resolve, reject) => {
        readInstalled(dir, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(flatDependencies(data, new Set()));
            }
        });
    });
}
exports.devDependencies = devDependencies;
function flatDependencies(data, seen) {
    const deps = data.dependencies;
    if (deps == null) {
        return [];
    }
    return Object.keys(deps).map(function (d) {
        if (typeof deps[d] !== "object" || seen.has(deps[d])) {
            return null;
        }
        seen.add(deps[d]);
        if (deps[d].extraneous) {
            const extra = deps[d];
            delete deps[d];
            return extra.path;
        }
        return flatDependencies(deps[d], seen);
    }).filter(it => it !== null).reduce(function flat(l, r) {
        return l.concat(Array.isArray(r) ? r.reduce(flat, []) : r);
    }, []);
}
// https://github.com/joshwnj/minimatch-all/blob/master/index.js
function minimatchAll(path, patterns, stat) {
    let match = false;
    for (let pattern of patterns) {
        // If we've got a match, only re-test for exclusions.
        // if we don't have a match, only re-test for inclusions.
        if (match !== pattern.negate) {
            continue;
        }
        // partial match — pattern: foo/bar.txt path: foo — we must allow foo
        // use it only for non-negate patterns: const m = new Minimatch("!node_modules/@(electron-download|electron)/**/*", {dot: true }); m.match("node_modules", true) will return false, but must be true
        match = pattern.match(path, stat.isDirectory() && !pattern.negate);
    }
    return match;
}
//# sourceMappingURL=filter.js.map