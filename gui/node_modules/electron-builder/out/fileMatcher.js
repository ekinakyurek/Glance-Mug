"use strict";

const path = require("path");
const filter_1 = require("./util/filter");
const minimatch_1 = require("minimatch");
const util_1 = require("./util/util");
class FileMatcher {
    constructor(from, to, options, patterns) {
        this.options = options;
        this.from = this.expandPattern(from);
        this.to = this.expandPattern(to);
        this.patterns = util_1.asArray(patterns);
    }
    addPattern(pattern) {
        this.patterns.push(pattern);
    }
    isEmpty() {
        return this.patterns.length === 0;
    }
    getParsedPatterns(fromDir) {
        // https://github.com/electron-userland/electron-builder/issues/733
        const minimatchOptions = { dot: true };
        const parsedPatterns = [];
        const pathDifference = fromDir ? path.relative(fromDir, this.from) : null;
        for (let i = 0; i < this.patterns.length; i++) {
            let expandedPattern = this.expandPattern(this.patterns[i]);
            if (pathDifference) {
                expandedPattern = path.join(pathDifference, expandedPattern);
            }
            const parsedPattern = new minimatch_1.Minimatch(expandedPattern, minimatchOptions);
            parsedPatterns.push(parsedPattern);
            if (!filter_1.hasMagic(parsedPattern)) {
                // https://github.com/electron-userland/electron-builder/issues/545
                // add **/*
                parsedPatterns.push(new minimatch_1.Minimatch(`${ expandedPattern }/**/*`, minimatchOptions));
            }
        }
        return parsedPatterns;
    }
    createFilter(ignoreFiles, rawFilter, excludePatterns) {
        return filter_1.createFilter(this.from, this.getParsedPatterns(), ignoreFiles, rawFilter, excludePatterns);
    }
    expandPattern(pattern) {
        return pattern.replace(/\$\{arch}/g, this.options.arch).replace(/\$\{os}/g, this.options.os).replace(/\$\{\/\*}/g, "{,/**/*}");
    }
}
exports.FileMatcher = FileMatcher;
function deprecatedUserIgnoreFilter(ignore, appDir) {
    let ignoreFunc;
    if (typeof ignore === "function") {
        ignoreFunc = function (file) {
            return !ignore(file);
        };
    } else {
        if (!Array.isArray(ignore)) {
            ignore = [ignore];
        }
        ignoreFunc = function (file) {
            for (let i = 0; i < ignore.length; i++) {
                if (file.match(ignore[i])) {
                    return false;
                }
            }
            return true;
        };
    }
    return function filter(file) {
        let name = file.split(path.resolve(appDir))[1];
        if (path.sep === "\\") {
            // convert slashes so unix-format ignores work
            name = name.replace(/\\/g, "/");
        }
        return ignoreFunc(name);
    };
}
exports.deprecatedUserIgnoreFilter = deprecatedUserIgnoreFilter;
//# sourceMappingURL=fileMatcher.js.map