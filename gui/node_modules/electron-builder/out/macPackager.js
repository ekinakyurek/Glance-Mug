"use strict";

const platformPackager_1 = require("./platformPackager");
const metadata_1 = require("./metadata");
const path = require("path");
const bluebird_1 = require("bluebird");
const log_1 = require("./util/log");
const codeSign_1 = require("./codeSign");
const deepAssign_1 = require("./util/deepAssign");
const electron_osx_sign_tf_1 = require("electron-osx-sign-tf");
const dmg_1 = require("./targets/dmg");
const targetFactory_1 = require("./targets/targetFactory");
const appInfo_1 = require("./appInfo");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
class MacPackager extends platformPackager_1.PlatformPackager {
    constructor(info) {
        super(info);
        if (this.options.cscLink == null || process.platform !== "darwin") {
            this.codeSigningInfo = bluebird_1.Promise.resolve({});
        } else {
            this.codeSigningInfo = codeSign_1.createKeychain(info.tempDirManager, this.options.cscLink, this.getCscPassword(), this.options.cscInstallerLink, this.options.cscInstallerKeyPassword);
        }
    }
    prepareAppInfo(appInfo) {
        return new appInfo_1.AppInfo(appInfo.metadata, this.devMetadata, this.platformSpecificBuildOptions.bundleVersion);
    }
    getIconPath() {
        return __awaiter(this, void 0, void 0, function* () {
            let iconPath = this.platformSpecificBuildOptions.icon || this.devMetadata.build.icon;
            if (iconPath != null && !iconPath.endsWith(".icns")) {
                iconPath += ".icns";
            }
            return iconPath == null ? yield this.getDefaultIcon("icns") : path.resolve(this.projectDir, iconPath);
        });
    }
    normalizePlatformSpecificBuildOptions(options) {
        return super.normalizePlatformSpecificBuildOptions(options == null ? this.info.devMetadata.build.osx : options);
    }
    createTargets(targets, mapper, cleanupTasks) {
        for (let name of targets) {
            if (name === "dir") {
                continue;
            }
            if (name === targetFactory_1.DEFAULT_TARGET) {
                mapper("dmg", () => new dmg_1.DmgTarget(this));
                mapper("zip", () => new platformPackager_1.Target("zip"));
            } else if (name === "dmg") {
                mapper("dmg", () => new dmg_1.DmgTarget(this));
            } else {
                mapper(name, () => name === "mas" ? new platformPackager_1.Target("mas") : targetFactory_1.createCommonTarget(name));
            }
        }
    }
    get platform() {
        return metadata_1.Platform.MAC;
    }
    pack(outDir, arch, targets, postAsyncTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            let nonMasPromise = null;
            const hasMas = targets.length !== 0 && targets.some(it => it.name === "mas");
            if (!hasMas || targets.length > 1) {
                const appOutDir = this.computeAppOutDir(outDir, arch);
                nonMasPromise = this.doPack(outDir, appOutDir, this.platform.nodeName, arch, this.platformSpecificBuildOptions).then(() => this.sign(appOutDir, null)).then(() => {
                    this.packageInDistributableFormat(appOutDir, targets, postAsyncTasks);
                });
            }
            if (hasMas) {
                // osx-sign - disable warning
                const appOutDir = path.join(outDir, "mas");
                const masBuildOptions = deepAssign_1.deepAssign({}, this.platformSpecificBuildOptions, this.devMetadata.build.mas);
                //noinspection JSUnusedGlobalSymbols
                yield this.doPack(outDir, appOutDir, "mas", arch, masBuildOptions);
                yield this.sign(appOutDir, masBuildOptions);
            }
            if (nonMasPromise != null) {
                yield nonMasPromise;
            }
        });
    }
    sign(appOutDir, masOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.platform !== "darwin") {
                return;
            }
            let keychainName = (yield this.codeSigningInfo).keychainName;
            const masQualifier = masOptions == null ? null : masOptions.identity || this.platformSpecificBuildOptions.identity;
            let name = yield codeSign_1.findIdentity(masOptions == null ? "Developer ID Application" : "3rd Party Mac Developer Application", masOptions == null ? this.platformSpecificBuildOptions.identity : masQualifier, keychainName);
            if (name == null) {
                let message = "App is not signed: CSC_LINK is not specified, and no valid identity in the keychain, see https://github.com/electron-userland/electron-builder/wiki/Code-Signing";
                if (masOptions == null) {
                    message += `\nMust be "Developer ID Application:" or custom non-Apple code signing certificate`;
                    log_1.warn(message);
                    return;
                } else {
                    message += `\nMust be "3rd Party Mac Developer Application:" and "3rd Party Mac Developer Installer:"`;
                    throw new Error(message);
                }
            }
            let installerName = null;
            if (masOptions != null) {
                installerName = yield codeSign_1.findIdentity("3rd Party Mac Developer Installer", masQualifier, keychainName);
                if (installerName == null) {
                    throw new Error("Cannot find valid installer certificate: CSC_LINK is not specified, and no valid identity in the keychain, see https://github.com/electron-userland/electron-builder/wiki/Code-Signing");
                }
            }
            const baseSignOptions = {
                app: path.join(appOutDir, `${ this.appInfo.productFilename }.app`),
                platform: masOptions == null ? "darwin" : "mas",
                keychain: keychainName || undefined,
                version: this.info.electronVersion
            };
            const signOptions = Object.assign({
                identity: name
            }, this.devMetadata.build["osx-sign"], baseSignOptions);
            const resourceList = yield this.resourceList;
            if (resourceList.indexOf(`entitlements.osx.plist`) !== -1) {
                throw new Error("entitlements.osx.plist is deprecated name, please use entitlements.mac.plist");
            }
            if (resourceList.indexOf(`entitlements.osx.inherit.plist`) !== -1) {
                throw new Error("entitlements.osx.inherit.plist is deprecated name, please use entitlements.mac.inherit.plist");
            }
            const customSignOptions = masOptions || this.platformSpecificBuildOptions;
            if (customSignOptions.entitlements != null) {
                signOptions.entitlements = customSignOptions.entitlements;
            } else {
                const p = `entitlements.${ masOptions == null ? "mac" : "mas" }.plist`;
                if (resourceList.indexOf(p) !== -1) {
                    signOptions.entitlements = path.join(this.buildResourcesDir, p);
                }
            }
            if (customSignOptions.entitlementsInherit != null) {
                signOptions["entitlements-inherit"] = customSignOptions.entitlementsInherit;
            } else {
                const p = `entitlements.${ masOptions == null ? "mac" : "mas" }.inherit.plist`;
                if (resourceList.indexOf(p) !== -1) {
                    signOptions["entitlements-inherit"] = path.join(this.buildResourcesDir, p);
                }
            }
            yield log_1.task(`Signing app (identity: ${ name })`, this.doSign(signOptions));
            if (masOptions != null) {
                yield log_1.task(`Signing app (identity: ${ name })`, this.doSign(signOptions));
                const pkg = path.join(appOutDir, `${ this.appInfo.productFilename }-${ this.appInfo.version }.pkg`);
                yield this.doFlat(Object.assign({
                    pkg: pkg,
                    identity: installerName
                }, baseSignOptions));
                this.dispatchArtifactCreated(pkg, `${ this.appInfo.name }-${ this.appInfo.version }.pkg`);
            }
        });
    }
    //noinspection JSMethodCanBeStatic
    doSign(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return electron_osx_sign_tf_1.signAsync(opts);
        });
    }
    //noinspection JSMethodCanBeStatic
    doFlat(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return electron_osx_sign_tf_1.flatAsync(opts);
        });
    }
    packageInDistributableFormat(appOutDir, targets, promises) {
        for (let t of targets) {
            const target = t.name;
            if (t instanceof dmg_1.DmgTarget) {
                promises.push(t.build(appOutDir));
            } else if (target !== "mas") {
                log_1.log(`Creating MacOS ${ target }`);
                // we use app name here - see https://github.com/electron-userland/electron-builder/pull/204
                const outFile = path.join(appOutDir, this.generateName2(target, "mac", false));
                promises.push(this.archiveApp(target, appOutDir, outFile).then(() => this.dispatchArtifactCreated(outFile, this.generateName2(target, "mac", true))));
            }
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MacPackager;
//# sourceMappingURL=macPackager.js.map