"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

const platformPackager_1 = require("../platformPackager");
const metadata_1 = require("../metadata");
const path = require("path");
const util_1 = require("../util/util");
const fs_extra_p_1 = require("fs-extra-p");
const binDownload_1 = require("../util/binDownload");
const bluebird_1 = require("bluebird");
const uuid_1345_1 = require("uuid-1345");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
const appImageVersion = process.platform === "darwin" ? "AppImage-09-07-16-mac" : "AppImage-09-07-16-linux";
//noinspection SpellCheckingInspection
const appImageSha256 = process.platform === "darwin" ? "5d4a954876654403698a01ef5bd7f218f18826261332e7d31d93ab4432fa0312" : "ac324e90b502f4e995f6a169451dbfc911bb55c0077e897d746838e720ae0221";
//noinspection SpellCheckingInspection
const appImagePathPromise = binDownload_1.getBin("AppImage", appImageVersion, `https://dl.bintray.com/electron-userland/bin/${ appImageVersion }.7z`, appImageSha256);
class AppImageTarget extends platformPackager_1.TargetEx {
    constructor(packager, helper, outDir) {
        super("appImage");
        this.packager = packager;
        this.helper = helper;
        this.outDir = outDir;
        this.options = Object.assign({}, this.packager.platformSpecificBuildOptions, this.packager.devMetadata.build[this.name]);
        // we add X-AppImage-BuildId to ensure that new desktop file will be installed
        this.desktopEntry = bluebird_1.Promise.promisify(uuid_1345_1.v1)({ mac: false }).then(uuid => helper.computeDesktopEntry(this.options, "AppRun", {
            "X-AppImage-Version": `${ packager.appInfo.buildVersion }`,
            "X-AppImage-BuildId": uuid
        }));
    }
    build(appOutDir, arch) {
        return __awaiter(this, void 0, void 0, function* () {
            const packager = this.packager;
            // avoid spaces in the file name
            const image = path.join(this.outDir, packager.generateName("AppImage", arch, true));
            const appInfo = packager.appInfo;
            yield util_1.unlinkIfExists(image);
            const appImagePath = yield appImagePathPromise;
            const appExecutableImagePath = `/usr/bin/${ appInfo.name }`;
            const args = ["-joliet", "on", "-volid", "AppImage", "-dev", image, "-padding", "0", "-map", appOutDir, "/usr/bin", "-map", path.join(__dirname, "..", "..", "templates", "linux", "AppRun.sh"), "/AppRun", "-map", yield this.desktopEntry, `/${ appInfo.name }.desktop`, "-move", `/usr/bin/${ appInfo.productFilename }`, appExecutableImagePath,
            // http://stackoverflow.com/questions/13633488/can-i-store-unix-permissions-in-a-zip-file-built-with-apache-ant, xorriso doesn't preserve it for zip, but we set it in any case
            "-chmod", "+x", "/AppRun", appExecutableImagePath, "--"];
            for (let _ref of yield this.helper.icons) {
                var _ref2 = _slicedToArray(_ref, 2);

                let from = _ref2[0];
                let to = _ref2[1];

                args.push("-map", from, `/usr/share/icons/default/${ to }`);
            }
            // must be after this.helper.icons call
            if (this.helper.maxIconPath == null) {
                throw new Error("Icon is not provided");
            }
            args.push("-map", this.helper.maxIconPath, "/.DirIcon");
            args.push("-chown_r", "0", "/", "--");
            args.push("-zisofs", `level=${ packager.devMetadata.build.compression === "store" ? "0" : "9" }:block_size=128k:by_magic=off`);
            args.push("set_filter_r", "--zisofs", "/");
            yield util_1.exec(process.env.USE_SYSTEM_FPM === "true" || process.arch !== "x64" ? "xorriso" : path.join(appImagePath, "xorriso"), args);
            yield new bluebird_1.Promise((resolve, reject) => {
                const rd = fs_extra_p_1.createReadStream(path.join(appImagePath, arch === metadata_1.Arch.ia32 ? "32" : "64", "runtime"));
                rd.on("error", reject);
                const wr = fs_extra_p_1.createWriteStream(image, { flags: "r+" });
                wr.on("error", reject);
                wr.on("finish", resolve);
                rd.pipe(wr);
            });
            const fd = yield fs_extra_p_1.open(image, "r+");
            try {
                const magicData = new Buffer([0x41, 0x49, 0x01]);
                yield fs_extra_p_1.write(fd, magicData, 0, magicData.length, 8);
            } finally {
                yield fs_extra_p_1.close(fd);
            }
            yield fs_extra_p_1.chmod(image, "0755");
            packager.dispatchArtifactCreated(image, packager.generateName("AppImage", arch, true));
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AppImageTarget;
//# sourceMappingURL=appImage.js.map