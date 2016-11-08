"use strict";

const platformPackager_1 = require("../platformPackager");
exports.commonTargets = ["dir", "zip", "7z", "tar.xz", "tar.lz", "tar.gz", "tar.bz2"];
exports.DEFAULT_TARGET = "default";
exports.DIR_TARGET = "dir";
function createTargets(nameToTarget, rawList, outDir, packager, cleanupTasks) {
    const result = [];
    const mapper = (name, factory) => {
        let target = nameToTarget.get(name);
        if (target == null) {
            target = factory(outDir);
            nameToTarget.set(name, target);
        }
        result.push(target);
    };
    const targets = normalizeTargets(rawList == null || rawList.length === 0 ? packager.platformSpecificBuildOptions.target : rawList);
    packager.createTargets(targets == null ? [exports.DEFAULT_TARGET] : targets, mapper, cleanupTasks);
    return result;
}
exports.createTargets = createTargets;
function normalizeTargets(targets) {
    if (targets == null) {
        return null;
    } else {
        return (Array.isArray(targets) ? targets : [targets]).map(it => it.toLowerCase().trim());
    }
}
function createCommonTarget(target) {
    if (!(exports.commonTargets.indexOf(target) !== -1)) {
        throw new Error(`Unknown target: ${ target }`);
    }
    return new platformPackager_1.Target(target);
}
exports.createCommonTarget = createCommonTarget;
//# sourceMappingURL=targetFactory.js.map