"use strict";

const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const util_1 = require("../util/util");
const bluebird_1 = require("bluebird");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
exports.installPrefix = "/opt";
class LinuxTargetHelper {
    constructor(packager) {
        this.packager = packager;
        this.maxIconPath = null;
        this.icons = this.computeDesktopIcons();
    }
    // must be name without spaces and other special characters, but not product name used
    computeDesktopIcons() {
        return __awaiter(this, void 0, void 0, function* () {
            const resourceList = yield this.packager.resourceList;
            if (resourceList.indexOf("icons") !== -1) {
                return this.iconsFromDir(path.join(this.packager.buildResourcesDir, "icons"));
            } else {
                return this.createFromIcns((yield this.packager.getTempFile("electron-builder-linux.iconset").then(it => fs_extra_p_1.ensureDir(it).thenReturn(it))));
            }
        });
    }
    iconsFromDir(iconsDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const mappings = [];
            let maxSize = 0;
            for (let file of yield fs_extra_p_1.readdir(iconsDir)) {
                if (file.endsWith(".png") || file.endsWith(".PNG")) {
                    // If parseInt encounters a character that is not a numeral in the specified radix,
                    // it returns the integer value parsed up to that point
                    try {
                        const size = parseInt(file, 10);
                        if (size > 0) {
                            const iconPath = `${ iconsDir }/${ file }`;
                            mappings.push([iconPath, `${ size }x${ size }/apps/${ this.packager.appInfo.name }.png`]);
                            if (size > maxSize) {
                                maxSize = size;
                                this.maxIconPath = iconPath;
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            return mappings;
        });
    }
    getIcns() {
        return __awaiter(this, void 0, void 0, function* () {
            const build = this.packager.devMetadata.build;
            let iconPath = (build.mac || {}).icon || build.icon;
            if (iconPath != null && !iconPath.endsWith(".icns")) {
                iconPath += ".icns";
            }
            return iconPath == null ? yield this.packager.getDefaultIcon("icns") : path.resolve(this.packager.projectDir, iconPath);
        });
    }
    computeDesktopEntry(platformSpecificBuildOptions, exec, extra) {
        return __awaiter(this, void 0, void 0, function* () {
            const appInfo = this.packager.appInfo;
            const productFilename = appInfo.productFilename;
            const tempFile = yield this.packager.getTempFile(`${ productFilename }.desktop`);
            const desktopMeta = Object.assign({
                Name: appInfo.productName,
                Comment: platformSpecificBuildOptions.description || appInfo.description,
                Exec: exec == null ? `"${ exports.installPrefix }/${ productFilename }/${ productFilename }"` : exec,
                Terminal: "false",
                Type: "Application",
                Icon: appInfo.name
            }, extra, platformSpecificBuildOptions.desktop);
            const category = platformSpecificBuildOptions.category;
            if (!util_1.isEmptyOrSpaces(category)) {
                desktopMeta.Categories = category;
            }
            let data = `[Desktop Entry]`;
            for (let name of Object.keys(desktopMeta)) {
                const value = desktopMeta[name];
                data += `\n${ name }=${ value }`;
            }
            data += "\n";
            yield fs_extra_p_1.outputFile(tempFile, data);
            return tempFile;
        });
    }
    createFromIcns(tempDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const iconPath = yield this.getIcns();
            if (iconPath == null) {
                return this.iconsFromDir(path.join(__dirname, "..", "..", "templates", "linux", "electron-icons"));
            }
            if (process.platform === "darwin") {
                yield util_1.exec("iconutil", ["--convert", "iconset", "--output", tempDir, iconPath]);
                const iconFiles = yield fs_extra_p_1.readdir(tempDir);
                const imagePath = iconFiles.indexOf("icon_512x512.png") !== -1 ? path.join(tempDir, "icon_512x512.png") : path.join(tempDir, "icon_256x256.png");
                this.maxIconPath = imagePath;
                function resize(size) {
                    const filename = `icon_${ size }x${ size }.png`;
                    if (iconFiles.indexOf(filename) !== -1) {
                        return bluebird_1.Promise.resolve();
                    }
                    const sizeArg = `${ size }x${ size }`;
                    return util_1.exec("gm", ["convert", "-size", sizeArg, imagePath, "-resize", sizeArg, path.join(tempDir, filename)]);
                }
                const promises = [resize(24), resize(96)];
                promises.push(resize(16));
                promises.push(resize(48));
                promises.push(resize(64));
                promises.push(resize(128));
                yield bluebird_1.Promise.all(promises);
                return this.createMappings(tempDir);
            } else {
                const output = yield util_1.exec("icns2png", ["-x", "-o", tempDir, iconPath]);
                util_1.debug(output);
                //noinspection UnnecessaryLocalVariableJS
                const imagePath = path.join(tempDir, "icon_256x256x32.png");
                this.maxIconPath = imagePath;
                function resize(size) {
                    const sizeArg = `${ size }x${ size }`;
                    return util_1.exec("gm", ["convert", "-size", sizeArg, imagePath, "-resize", sizeArg, path.join(tempDir, `icon_${ size }x${ size }x32.png`)]);
                }
                const promises = [resize(24), resize(96)];
                if (!(output.indexOf("is32") !== -1)) {
                    promises.push(resize(16));
                }
                if (!(output.indexOf("ih32") !== -1)) {
                    promises.push(resize(48));
                }
                if (!(output.toString().indexOf("icp6") !== -1)) {
                    promises.push(resize(64));
                }
                if (!(output.indexOf("it32") !== -1)) {
                    promises.push(resize(128));
                }
                yield bluebird_1.Promise.all(promises);
                return this.createMappings(tempDir);
            }
        });
    }
    createMappings(tempDir) {
        const appName = this.packager.appInfo.name;
        function createMapping(size) {
            return [process.platform === "darwin" ? `${ tempDir }/icon_${ size }x${ size }.png` : `${ tempDir }/icon_${ size }x${ size }x32.png`, `${ size }x${ size }/apps/${ appName }.png`];
        }
        return [createMapping("16"), createMapping("24"), createMapping("32"), createMapping("48"), createMapping("64"), createMapping("96"), createMapping("128"), createMapping("256"), createMapping("512")];
    }
}
exports.LinuxTargetHelper = LinuxTargetHelper;
//# sourceMappingURL=LinuxTargetHelper.js.map