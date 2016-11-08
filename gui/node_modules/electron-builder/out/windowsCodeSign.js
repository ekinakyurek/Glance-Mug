"use strict";

const util_1 = require("./util/util");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const os_1 = require("os");
const binDownload_1 = require("./util/binDownload");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
const TOOLS_VERSION = "1.4.2";
function getSignVendorPath() {
    return binDownload_1.getBinFromBintray("winCodeSign", TOOLS_VERSION, "ca94097071ce6433a2e18a14518b905ac162afaef82ed88713a8a91c32a55b21");
}
exports.getSignVendorPath = getSignVendorPath;
function sign(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let hashes = options.hash;
        // msi does not support dual-signing
        if (path.extname(options.path) === ".msi") {
            hashes = [hashes != null && !(hashes.indexOf("sha1") !== -1) ? "sha256" : "sha1"];
        } else {
            if (hashes == null) {
                hashes = ["sha1", "sha256"];
            } else {
                hashes = Array.isArray(hashes) ? hashes.slice() : [hashes];
            }
        }
        const isWin = process.platform === "win32";
        let nest = false;
        //noinspection JSUnusedAssignment
        let outputPath = "";
        for (let hash of hashes) {
            outputPath = isWin ? options.path : getOutputPath(options.path, hash);
            yield spawnSign(options, options.path, outputPath, hash, nest);
            nest = true;
            if (!isWin) {
                yield fs_extra_p_1.rename(outputPath, options.path);
            }
        }
    });
}
exports.sign = sign;
// on windows be aware of http://stackoverflow.com/a/32640183/1910191
function spawnSign(options, inputPath, outputPath, hash, nest) {
    return __awaiter(this, void 0, void 0, function* () {
        const timestampingServiceUrl = "http://timestamp.verisign.com/scripts/timstamp.dll";
        const isWin = process.platform === "win32";
        const args = isWin ? ["sign", nest || hash === "sha256" ? "/tr" : "/t", nest || hash === "sha256" ? options.tr || "http://timestamp.comodoca.com/rfc3161" : timestampingServiceUrl] : ["-in", inputPath, "-out", outputPath, "-t", timestampingServiceUrl];
        const certificateFile = options.cert;
        if (certificateFile == null) {
            if (process.platform !== "win32") {
                throw new Error("certificateSubjectName supported only on Windows");
            }
            args.push("/n", options.subjectName);
        } else {
            const certExtension = path.extname(certificateFile);
            if (certExtension === ".p12" || certExtension === ".pfx") {
                args.push(isWin ? "/f" : "-pkcs12", certificateFile);
            } else {
                throw new Error(`Please specify pkcs12 (.p12/.pfx) file, ${ certificateFile } is not correct`);
            }
        }
        if (!isWin || hash !== "sha1") {
            args.push(isWin ? "/fd" : "-h", hash);
            if (isWin) {
                args.push("/td", "sha256");
            }
        }
        if (options.name) {
            args.push(isWin ? "/d" : "-n", options.name);
        }
        if (options.site) {
            args.push(isWin ? "/du" : "-i", options.site);
        }
        // msi does not support dual-signing
        if (nest) {
            args.push(isWin ? "/as" : "-nest");
        }
        if (options.password) {
            args.push(isWin ? "/p" : "-pass", options.password);
        }
        if (isWin) {
            // must be last argument
            args.push(inputPath);
        }
        return yield util_1.exec((yield getToolPath()), args);
    });
}
// async function verify(options: any) {
//   const out = await exec(await getToolPath(options), [
//     "verify",
//     "-in", options.path,
//     "-require-leaf-hash", options.hash
//   ])
//   if (out.includes("No signature found.")) {
//     throw new Error("No signature found")
//   }
//   else if (out.includes("Leaf hash match: failed")) {
//     throw new Error("Leaf hash match failed")
//   }
// }
function getOutputPath(inputPath, hash) {
    const extension = path.extname(inputPath);
    return path.join(path.dirname(inputPath), `${ path.basename(inputPath, extension) }-signed-${ hash }${ extension }`);
}
function getToolPath() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.USE_SYSTEM_SIGNCODE) {
            return "osslsigncode";
        }
        let result = process.env.SIGNTOOL_PATH;
        if (result) {
            return result;
        }
        const vendorPath = yield getSignVendorPath();
        if (process.platform === "win32") {
            return path.join(vendorPath, `windows-${ os_1.release().startsWith("6.") ? "6" : "10" }`, "signtool.exe");
        } else if (process.platform === "darwin" && process.env.CI) {
            return path.join(vendorPath, process.platform, "ci", "osslsigncode");
        } else {
            return path.join(vendorPath, process.platform, "osslsigncode");
        }
    });
}
//# sourceMappingURL=windowsCodeSign.js.map