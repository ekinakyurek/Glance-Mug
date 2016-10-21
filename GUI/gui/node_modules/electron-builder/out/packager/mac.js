"use strict";

const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const plist_1 = require("plist");
const bluebird_1 = require("bluebird");
const util_1 = require("../util/util");
const platformPackager_1 = require("../platformPackager");
const log_1 = require("../util/log");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
function doRename(basePath, oldName, newName) {
    return fs_extra_p_1.rename(path.join(basePath, oldName), path.join(basePath, newName));
}
function moveHelpers(frameworksPath, appName) {
    return bluebird_1.Promise.map([" Helper", " Helper EH", " Helper NP"], suffix => {
        const executableBasePath = path.join(frameworksPath, `Electron${ suffix }.app`, "Contents", "MacOS");
        return doRename(executableBasePath, `Electron${ suffix }`, appName + suffix).then(() => doRename(frameworksPath, `Electron${ suffix }.app`, `${ appName }${ suffix }.app`));
    });
}
function filterCFBundleIdentifier(identifier) {
    // Remove special characters and allow only alphanumeric (A-Z,a-z,0-9), hyphen (-), and period (.)
    // Apple documentation: https://developer.apple.com/library/mac/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102070
    return identifier.replace(/ /g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
}
function createApp(packager, appOutDir, initializeApp) {
    return __awaiter(this, void 0, void 0, function* () {
        const appInfo = packager.appInfo;
        const appFilename = appInfo.productFilename;
        const contentsPath = path.join(appOutDir, "Electron.app", "Contents");
        const frameworksPath = path.join(contentsPath, "Frameworks");
        const appPlistFilename = path.join(contentsPath, "Info.plist");
        const helperPlistFilename = path.join(frameworksPath, "Electron Helper.app", "Contents", "Info.plist");
        const helperEHPlistFilename = path.join(frameworksPath, "Electron Helper EH.app", "Contents", "Info.plist");
        const helperNPPlistFilename = path.join(frameworksPath, "Electron Helper NP.app", "Contents", "Info.plist");
        const buildMetadata = packager.devMetadata.build;
        const result = yield bluebird_1.Promise.all([initializeApp(), bluebird_1.Promise.map([appPlistFilename, helperPlistFilename, helperEHPlistFilename, helperNPPlistFilename, buildMetadata["extend-info"]], it => it == null ? it : fs_extra_p_1.readFile(it, "utf8"))]);
        const fileContents = result[1];
        const appPlist = plist_1.parse(fileContents[0]);
        const helperPlist = plist_1.parse(fileContents[1]);
        const helperEHPlist = plist_1.parse(fileContents[2]);
        const helperNPPlist = plist_1.parse(fileContents[3]);
        // If an extend-info file was supplied, copy its contents in first
        if (fileContents[4] != null) {
            Object.assign(appPlist, plist_1.parse(fileContents[4]));
        }
        const appBundleIdentifier = filterCFBundleIdentifier(appInfo.id);
        const oldHelperBundleId = buildMetadata["helper-bundle-id"];
        if (oldHelperBundleId != null) {
            log_1.warn("build.helper-bundle-id is deprecated, please set as build.mac.helperBundleId");
        }
        const helperBundleIdentifier = filterCFBundleIdentifier(packager.platformSpecificBuildOptions.helperBundleId || oldHelperBundleId || `${ appBundleIdentifier }.helper`);
        const icon = yield packager.getIconPath();
        const oldIcon = appPlist.CFBundleIconFile;
        if (icon != null) {
            appPlist.CFBundleIconFile = `${ appInfo.productFilename }.icns`;
        }
        appPlist.CFBundleDisplayName = appInfo.productName;
        appPlist.CFBundleIdentifier = appBundleIdentifier;
        appPlist.CFBundleName = appInfo.productName;
        helperPlist.CFBundleDisplayName = `${ appInfo.productName } Helper`;
        helperPlist.CFBundleIdentifier = helperBundleIdentifier;
        appPlist.CFBundleExecutable = appFilename;
        helperPlist.CFBundleName = appInfo.productName;
        helperPlist.CFBundleExecutable = `${ appFilename } Helper`;
        helperEHPlist.CFBundleDisplayName = `${ appFilename } Helper EH`;
        helperEHPlist.CFBundleIdentifier = `${ helperBundleIdentifier }.EH`;
        helperEHPlist.CFBundleName = `${ appInfo.productName } Helper EH`;
        helperEHPlist.CFBundleExecutable = `${ appFilename } Helper EH`;
        helperNPPlist.CFBundleDisplayName = `${ appInfo.productName } Helper NP`;
        helperNPPlist.CFBundleIdentifier = `${ helperBundleIdentifier }.NP`;
        helperNPPlist.CFBundleName = `${ appInfo.productName } Helper NP`;
        helperNPPlist.CFBundleExecutable = `${ appFilename } Helper NP`;
        util_1.use(appInfo.version, it => {
            appPlist.CFBundleShortVersionString = it;
            appPlist.CFBundleVersion = it;
        });
        util_1.use(appInfo.buildVersion, it => appPlist.CFBundleVersion = it);
        const protocols = util_1.asArray(buildMetadata.protocols).concat(util_1.asArray(packager.platformSpecificBuildOptions.protocols));
        if (protocols.length > 0) {
            appPlist.CFBundleURLTypes = protocols.map(protocol => {
                const schemes = util_1.asArray(protocol.schemes);
                if (schemes.length === 0) {
                    throw new Error(`Protocol "${ protocol.name }": must be at least one scheme specified`);
                }
                return {
                    CFBundleURLName: protocol.name,
                    CFBundleTypeRole: protocol.role || "Editor",
                    CFBundleURLSchemes: schemes.slice()
                };
            });
        }
        const fileAssociations = packager.getFileAssociations();
        if (fileAssociations.length > 0) {
            appPlist.CFBundleDocumentTypes = yield bluebird_1.Promise.map(fileAssociations, fileAssociation => __awaiter(this, void 0, void 0, function* () {
                const extensions = util_1.asArray(fileAssociation.ext).map(platformPackager_1.normalizeExt);
                const customIcon = yield packager.getResource(fileAssociation.icon, `${ extensions[0] }.icns`);
                // todo rename electron.icns
                return {
                    CFBundleTypeExtensions: extensions,
                    CFBundleTypeName: fileAssociation.name,
                    CFBundleTypeRole: fileAssociation.role || "Editor",
                    CFBundleTypeIconFile: customIcon || appPlist.CFBundleIconFile
                };
            }));
        }
        const oldCategory = buildMetadata["app-category-type"];
        if (oldCategory != null) {
            log_1.warn("app-category-type is deprecated, please set as build.mac.category");
        }
        let category = packager.platformSpecificBuildOptions.category || buildMetadata.category || oldCategory;
        util_1.use(category || oldCategory, it => appPlist.LSApplicationCategoryType = it);
        util_1.use(appInfo.copyright, it => appPlist.NSHumanReadableCopyright = it);
        const promises = [fs_extra_p_1.writeFile(appPlistFilename, plist_1.build(appPlist)), fs_extra_p_1.writeFile(helperPlistFilename, plist_1.build(helperPlist)), fs_extra_p_1.writeFile(helperEHPlistFilename, plist_1.build(helperEHPlist)), fs_extra_p_1.writeFile(helperNPPlistFilename, plist_1.build(helperNPPlist)), doRename(path.join(contentsPath, "MacOS"), "Electron", appPlist.CFBundleExecutable)];
        if (icon != null) {
            promises.push(fs_extra_p_1.unlink(path.join(contentsPath, "Resources", oldIcon)));
            promises.push(fs_extra_p_1.copy(icon, path.join(contentsPath, "Resources", appPlist.CFBundleIconFile)));
        }
        yield bluebird_1.Promise.all(promises);
        yield moveHelpers(frameworksPath, appFilename);
        yield fs_extra_p_1.rename(path.dirname(contentsPath), path.join(appOutDir, `${ appFilename }.app`));
    });
}
exports.createApp = createApp;
//# sourceMappingURL=mac.js.map