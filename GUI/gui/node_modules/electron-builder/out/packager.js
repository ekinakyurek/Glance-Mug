"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

const path = require("path");
const util_1 = require("./util/util");
const promise_1 = require("./util/promise");
const events_1 = require("events");
const bluebird_1 = require("bluebird");
const metadata_1 = require("./metadata");
const errorMessages = require("./errorMessages");
const util = require("util");
const deepAssign_1 = require("./util/deepAssign");
const semver = require("semver");
const log_1 = require("./util/log");
const appInfo_1 = require("./appInfo");
const targetFactory_1 = require("./targets/targetFactory");
const readPackageJson_1 = require("./util/readPackageJson");
const tmp_1 = require("./util/tmp");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
function addHandler(emitter, event, handler) {
    emitter.on(event, handler);
}
class Packager {
    //noinspection JSUnusedGlobalSymbols
    constructor(options) {
        this.options = options;
        this.isTwoPackageJsonProjectLayoutUsed = true;
        this.eventEmitter = new events_1.EventEmitter();
        this.tempDirManager = new tmp_1.TmpDir();
        this.projectDir = options.projectDir == null ? process.cwd() : path.resolve(options.projectDir);
    }
    artifactCreated(handler) {
        addHandler(this.eventEmitter, "artifactCreated", handler);
        return this;
    }
    get devPackageFile() {
        return path.join(this.projectDir, "package.json");
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            const devPackageFile = this.devPackageFile;
            const extraMetadata = this.options.extraMetadata;
            const extraBuildMetadata = extraMetadata == null ? null : extraMetadata.build;
            this.devMetadata = deepAssign_1.deepAssign((yield readPackageJson_1.readPackageJson(devPackageFile)), this.options.devMetadata);
            if (extraMetadata != null) {
                if (extraBuildMetadata != null) {
                    deepAssign_1.deepAssign(this.devMetadata, { build: extraBuildMetadata });
                    delete extraMetadata.build;
                }
                if (extraMetadata.directories != null) {
                    deepAssign_1.deepAssign(this.devMetadata, { directories: extraMetadata.directories });
                    delete extraMetadata.directories;
                }
            }
            this.appDir = yield util_1.computeDefaultAppDirectory(this.projectDir, util_1.use(this.devMetadata.directories, it => it.app));
            this.isTwoPackageJsonProjectLayoutUsed = this.appDir !== this.projectDir;
            const appPackageFile = this.isTwoPackageJsonProjectLayoutUsed ? path.join(this.appDir, "package.json") : devPackageFile;
            if (this.isTwoPackageJsonProjectLayoutUsed) {
                this.metadata = deepAssign_1.deepAssign((yield readPackageJson_1.readPackageJson(appPackageFile)), this.options.appMetadata, extraMetadata);
            } else {
                if (this.options.appMetadata != null) {
                    deepAssign_1.deepAssign(this.devMetadata, this.options.appMetadata);
                }
                if (extraMetadata != null) {
                    deepAssign_1.deepAssign(this.devMetadata, extraMetadata);
                }
                this.metadata = this.devMetadata;
            }
            this.checkMetadata(appPackageFile, devPackageFile);
            checkConflictingOptions(this.devMetadata.build);
            this.electronVersion = yield util_1.getElectronVersion(this.devMetadata, devPackageFile);
            this.appInfo = new appInfo_1.AppInfo(this.metadata, this.devMetadata);
            const cleanupTasks = [];
            return promise_1.executeFinally(this.doBuild(cleanupTasks), () => promise_1.all(cleanupTasks.map(it => it()).concat(this.tempDirManager.cleanup())));
        });
    }
    doBuild(cleanupTasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const distTasks = [];
            const outDir = path.resolve(this.projectDir, util_1.use(this.devMetadata.directories, it => it.output) || "dist");
            const platformToTarget = new Map();
            // custom packager - don't check wine
            let checkWine = this.options.platformPackagerFactory == null;
            for (let _ref of this.options.targets) {
                var _ref2 = _slicedToArray(_ref, 2);

                let platform = _ref2[0];
                let archToType = _ref2[1];

                if (platform === metadata_1.Platform.MAC && process.platform === metadata_1.Platform.WINDOWS.nodeName) {
                    throw new Error("Build for MacOS is supported only on MacOS, please see https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build");
                }
                let wineCheck = null;
                if (checkWine && process.platform !== "win32" && platform === metadata_1.Platform.WINDOWS) {
                    wineCheck = util_1.exec("wine", ["--version"]);
                }
                const helper = this.createHelper(platform, cleanupTasks);
                const nameToTarget = new Map();
                platformToTarget.set(platform, nameToTarget);
                for (let _ref3 of archToType) {
                    var _ref4 = _slicedToArray(_ref3, 2);

                    let arch = _ref4[0];
                    let targets = _ref4[1];

                    yield this.installAppDependencies(platform, arch);
                    if (checkWine && wineCheck != null) {
                        checkWine = false;
                        checkWineVersion(wineCheck);
                    }
                    yield helper.pack(outDir, arch, targetFactory_1.createTargets(nameToTarget, targets, outDir, helper, cleanupTasks), distTasks);
                }
                for (let target of nameToTarget.values()) {
                    distTasks.push(target.finishBuild());
                }
            }
            yield bluebird_1.Promise.all(distTasks);
            return platformToTarget;
        });
    }
    createHelper(platform, cleanupTasks) {
        if (this.options.platformPackagerFactory != null) {
            return this.options.platformPackagerFactory(this, platform, cleanupTasks);
        }
        switch (platform) {
            case metadata_1.Platform.MAC:
                {
                    const helperClass = require("./macPackager").default;
                    return new helperClass(this);
                }
            case metadata_1.Platform.WINDOWS:
                {
                    const helperClass = require("./winPackager").WinPackager;
                    return new helperClass(this);
                }
            case metadata_1.Platform.LINUX:
                return new (require("./linuxPackager").LinuxPackager)(this);
            default:
                throw new Error(`Unknown platform: ${ platform }`);
        }
    }
    checkMetadata(appPackageFile, devAppPackageFile) {
        const reportError = missedFieldName => {
            throw new Error(`Please specify '${ missedFieldName }' in the application package.json ('${ appPackageFile }')`);
        };
        const checkNotEmpty = (name, value) => {
            if (util_1.isEmptyOrSpaces(value)) {
                reportError(name);
            }
        };
        const appMetadata = this.metadata;
        checkNotEmpty("name", appMetadata.name);
        checkNotEmpty("description", appMetadata.description);
        checkNotEmpty("version", appMetadata.version);
        checkDependencies(this.devMetadata.dependencies);
        if (appMetadata !== this.devMetadata) {
            checkDependencies(appMetadata.dependencies);
            if (appMetadata.build != null) {
                throw new Error(util.format(errorMessages.buildInAppSpecified, appPackageFile, devAppPackageFile));
            }
        }
        const build = this.devMetadata.build;
        if (build == null) {
            throw new Error(util.format(errorMessages.buildIsMissed, devAppPackageFile));
        } else {
            const author = appMetadata.author;
            if (author == null) {
                throw new Error(`Please specify "author" in the application package.json ('${ appPackageFile }') — it is used as company name.`);
            }
            if (build.name != null) {
                throw new Error(util.format(errorMessages.nameInBuildSpecified, appPackageFile));
            }
            if (build.osx != null) {
                log_1.warn('"build.osx" is deprecated — please use "mac" instead of "osx"');
            }
            if (build.prune != null) {
                log_1.warn("prune is deprecated — development dependencies are never copied in any case");
            }
        }
    }
    installAppDependencies(platform, arch) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.devMetadata.build.nodeGypRebuild === true) {
                log_1.log(`Execute node-gyp rebuild for arch ${ metadata_1.Arch[arch] }`);
                yield util_1.exec(process.platform === "win32" ? "node-gyp.cmd" : "node-gyp", ["rebuild"], {
                    env: util_1.getGypEnv(this.electronVersion, metadata_1.Arch[arch])
                });
            }
            if (this.isTwoPackageJsonProjectLayoutUsed) {
                if (this.devMetadata.build.npmRebuild === false) {
                    log_1.log("Skip app dependencies rebuild because npmRebuild is set to false");
                } else if (platform.nodeName === process.platform) {
                    const forceBuildFromSource = this.devMetadata.build.npmSkipBuildFromSource !== true;
                    yield util_1.installDependencies(this.appDir, this.electronVersion, metadata_1.Arch[arch], forceBuildFromSource, (yield util_1.statOrNull(path.join(this.appDir, "node_modules"))) == null ? "install" : "rebuild");
                } else {
                    log_1.log("Skip app dependencies rebuild because platform is different");
                }
            } else {
                log_1.log("Skip app dependencies rebuild because dev and app dependencies are not separated");
            }
        });
    }
}
exports.Packager = Packager;
function normalizePlatforms(rawPlatforms) {
    const platforms = rawPlatforms == null || Array.isArray(rawPlatforms) ? rawPlatforms : [rawPlatforms];
    if (platforms == null || platforms.length === 0) {
        return [metadata_1.Platform.fromString(process.platform)];
    } else if (platforms[0] === "all") {
        if (process.platform === metadata_1.Platform.MAC.nodeName) {
            return [metadata_1.Platform.MAC, metadata_1.Platform.LINUX, metadata_1.Platform.WINDOWS];
        } else if (process.platform === metadata_1.Platform.LINUX.nodeName) {
            // macOS code sign works only on macOS
            return [metadata_1.Platform.LINUX, metadata_1.Platform.WINDOWS];
        } else {
            return [metadata_1.Platform.WINDOWS];
        }
    } else {
        return platforms.map(it => it instanceof metadata_1.Platform ? it : metadata_1.Platform.fromString(it));
    }
}
exports.normalizePlatforms = normalizePlatforms;
function checkConflictingOptions(options) {
    for (let name of ["all", "out", "tmpdir", "version", "platform", "dir", "arch", "name", "extra-resource"]) {
        if (name in options) {
            throw new Error(`Option ${ name } is ignored, do not specify it.`);
        }
    }
}
function checkWineVersion(checkPromise) {
    return __awaiter(this, void 0, void 0, function* () {
        function wineError(prefix) {
            return `${ prefix }, please see https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#${ process.platform === "linux" ? "linux" : "os-x" }`;
        }
        let wineVersion;
        try {
            wineVersion = (yield checkPromise).trim();
        } catch (e) {
            if (e.code === "ENOENT") {
                throw new Error(wineError("wine is required"));
            } else {
                throw new Error(`Cannot check wine version: ${ e }`);
            }
        }
        if (wineVersion.startsWith("wine-")) {
            wineVersion = wineVersion.substring("wine-".length);
        }
        if (wineVersion.split(".").length === 2) {
            wineVersion += ".0";
        }
        if (semver.lt(wineVersion, "1.8.0")) {
            throw new Error(wineError(`wine 1.8+ is required, but your version is ${ wineVersion }`));
        }
    });
}
function checkDependencies(dependencies) {
    if (dependencies == null) {
        return;
    }
    for (let name of ["electron", "electron-prebuilt", "electron-builder"]) {
        if (name in dependencies) {
            throw new Error(`${ name } must be in the devDependencies`);
        }
    }
}
//# sourceMappingURL=packager.js.map