"use strict";

const path = require("path");
const bluebird_1 = require("bluebird");
const platformPackager_1 = require("./platformPackager");
const metadata_1 = require("./metadata");
const targetFactory_1 = require("./targets/targetFactory");
const LinuxTargetHelper_1 = require("./targets/LinuxTargetHelper");
const fs_extra_p_1 = require("fs-extra-p");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
class LinuxPackager extends platformPackager_1.PlatformPackager {
    constructor(info) {
        super(info);
    }
    normalizePlatformSpecificBuildOptions(options) {
        if (options != null && options.description != null) {
            return options;
        } else {
            return Object.assign({
                description: this.info.appInfo.description
            }, options);
        }
    }
    createTargets(targets, mapper, cleanupTasks) {
        for (let name of targets) {
            if (name === "dir") {
                continue;
            }
            let helper;
            const getHelper = () => {
                if (helper == null) {
                    helper = new LinuxTargetHelper_1.LinuxTargetHelper(this);
                }
                return helper;
            };
            if (name === targetFactory_1.DEFAULT_TARGET || name === "appimage") {
                const targetClass = require("./targets/appImage").default;
                mapper("appimage", outDir => new targetClass(this, getHelper(), outDir));
            } else if (name === "deb" || name === "rpm" || name === "sh" || name === "freebsd" || name === "pacman" || name === "apk" || name === "p5p") {
                const targetClass = require("./targets/fpm").default;
                mapper(name, outDir => new targetClass(name, this, getHelper(), outDir));
            } else {
                mapper(name, () => targetFactory_1.createCommonTarget(name));
            }
        }
    }
    get platform() {
        return metadata_1.Platform.LINUX;
    }
    pack(outDir, arch, targets, postAsyncTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const appOutDir = this.computeAppOutDir(outDir, arch);
            yield this.doPack(outDir, appOutDir, this.platform.nodeName, arch, this.platformSpecificBuildOptions);
            postAsyncTasks.push(this.packageInDistributableFormat(outDir, appOutDir, arch, targets));
        });
    }
    postInitApp(appOutDir) {
        return fs_extra_p_1.rename(path.join(appOutDir, "electron"), path.join(appOutDir, this.appInfo.productFilename));
    }
    packageInDistributableFormat(outDir, appOutDir, arch, targets) {
        return __awaiter(this, void 0, void 0, function* () {
            // todo fix fpm - if run in parallel, get strange tar errors
            for (let t of targets) {
                if (t instanceof platformPackager_1.TargetEx) {
                    yield t.build(appOutDir, arch);
                }
            }
            const promises = [];
            // https://github.com/electron-userland/electron-builder/issues/460
            // for some reasons in parallel to fmp we cannot use tar
            for (let t of targets) {
                const target = t.name;
                if (target === "zip" || target === "7z" || target.startsWith("tar.")) {
                    const destination = path.join(outDir, this.generateName(target, arch, true));
                    promises.push(this.archiveApp(target, appOutDir, destination).then(() => this.dispatchArtifactCreated(destination)));
                }
            }
            if (promises.length > 0) {
                yield bluebird_1.Promise.all(promises);
            }
        });
    }
}
exports.LinuxPackager = LinuxPackager;
//# sourceMappingURL=linuxPackager.js.map