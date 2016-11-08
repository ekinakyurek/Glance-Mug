"use strict";

const bluebird_1 = require("bluebird");
const fs_extra_p_1 = require("fs-extra-p");
const log_1 = require("../util/log");
const util_1 = require("../util/util");
const _7zip_bin_1 = require("7zip-bin");
const path = require("path");
const downloadElectron = bluebird_1.Promise.promisify(require("electron-download"));
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
function createDownloadOpts(opts, platform, arch, electronVersion) {
    const downloadOpts = Object.assign({
        cache: opts.cache,
        strictSSL: opts["strict-ssl"]
    }, opts.download);
    subOptionWarning(downloadOpts, "download", "platform", platform);
    subOptionWarning(downloadOpts, "download", "arch", arch);
    subOptionWarning(downloadOpts, "download", "version", electronVersion);
    return downloadOpts;
}
function subOptionWarning(properties, optionName, parameter, value) {
    if (properties.hasOwnProperty(parameter)) {
        log_1.warn(`${ optionName }.${ parameter } will be inferred from the main options`);
    }
    properties[parameter] = value;
}
function pack(packager, out, platform, arch, electronVersion, initializeApp) {
    return __awaiter(this, void 0, void 0, function* () {
        const electronDist = packager.devMetadata.build.electronDist;
        if (electronDist == null) {
            const zipPath = (yield bluebird_1.Promise.all([downloadElectron(createDownloadOpts(packager.devMetadata.build, platform, arch, electronVersion)), fs_extra_p_1.emptyDir(out)]))[0];
            yield util_1.spawn(_7zip_bin_1.path7za, util_1.debug7zArgs("x").concat(zipPath, `-o${ out }`));
        } else {
            yield fs_extra_p_1.emptyDir(out);
            yield fs_extra_p_1.copy(path.resolve(packager.info.projectDir, electronDist, "Electron.app"), path.join(out, "Electron.app"));
        }
        if (platform === "linux") {
            // https://github.com/electron-userland/electron-builder/issues/786
            // fix dir permissions — opposite to extract-zip, 7za creates dir with no-access for other users, but dir must be readable for non-root users
            yield bluebird_1.Promise.all([fs_extra_p_1.chmod(path.join(out, "locales"), "0755"), fs_extra_p_1.chmod(path.join(out, "resources"), "0755")]);
        }
        if (platform === "darwin" || platform === "mas") {
            yield require("./mac").createApp(packager, out, initializeApp);
        } else {
            yield initializeApp();
        }
    });
}
exports.pack = pack;
//# sourceMappingURL=dirPackager.js.map