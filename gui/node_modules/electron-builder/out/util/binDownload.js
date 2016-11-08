"use strict";

const util_1 = require("./util");
const fs_extra_p_1 = require("fs-extra-p");
const httpRequest_1 = require("./httpRequest");
const _7zip_bin_1 = require("7zip-bin");
const path = require("path");
const os_1 = require("os");
const bluebird_1 = require("bluebird");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
const versionToPromise = new Map();
function getBinFromBintray(name, version, sha2) {
    const dirName = `${ name }-${ version }`;
    return getBin(name, dirName, `https://dl.bintray.com/electron-userland/bin/${ dirName }.7z`, sha2);
}
exports.getBinFromBintray = getBinFromBintray;
function getBin(name, dirName, url, sha2) {
    let promise = versionToPromise.get(dirName);
    // if rejected, we will try to download again
    if (promise != null && !promise.isRejected()) {
        return promise;
    }
    promise = doGetBin(name, dirName, url, sha2);
    versionToPromise.set(dirName, promise);
    return promise;
}
exports.getBin = getBin;
// we cache in the global location - in the home dir, not in the node_modules/.cache (https://www.npmjs.com/package/find-cache-dir) because
// * don't need to find node_modules
// * don't pollute user project dir (important in case of 1-package.json project structure)
// * simplify/speed-up tests (don't download fpm for each test project)
function doGetBin(name, dirName, url, sha2) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachePath = path.join(os_1.homedir(), ".cache", name);
        const dirPath = path.join(cachePath, dirName);
        const dirStat = yield util_1.statOrNull(dirPath);
        if (dirStat != null && dirStat.isDirectory()) {
            util_1.debug(`Found existing ${ name } ${ dirPath }`);
            return dirPath;
        }
        // 7z cannot be extracted from the input stream, temp file is required
        const tempUnpackDir = path.join(cachePath, util_1.getTempName());
        const archiveName = `${ tempUnpackDir }.7z`;
        util_1.debug(`Download ${ name } from ${ url } to ${ archiveName }`);
        // 7z doesn't create out dir, so, we don't create dir in parallel to download - dir creation will create parent dirs for archive file also
        yield fs_extra_p_1.emptyDir(tempUnpackDir);
        yield httpRequest_1.download(url, archiveName, {
            skipDirCreation: true,
            sha2: sha2
        });
        yield util_1.spawn(_7zip_bin_1.path7za, util_1.debug7zArgs("x").concat(archiveName, `-o${ tempUnpackDir }`), {
            cwd: cachePath
        });
        yield bluebird_1.Promise.all([fs_extra_p_1.rename(tempUnpackDir, dirPath).catch(e => {
            console.warn(`Cannot move downloaded ${ name } into final location (another process downloaded faster?): ${ e }`);
        }), fs_extra_p_1.unlink(archiveName)]);
        util_1.debug(`${ name }} downloaded to ${ dirPath }`);
        return dirPath;
    });
}
//# sourceMappingURL=binDownload.js.map