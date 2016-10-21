"use strict";

class Platform {
    constructor(name, buildConfigurationKey, nodeName) {
        this.name = name;
        this.buildConfigurationKey = buildConfigurationKey;
        this.nodeName = nodeName;
    }
    toString() {
        return this.name;
    }
    toJSON() {
        return this.name;
    }
    createTarget(type) {
        for (var _len = arguments.length, archs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            archs[_key - 1] = arguments[_key];
        }

        const archToType = new Map();
        if (this === Platform.MAC) {
            archs = [Arch.x64];
        }
        for (let arch of archs == null || archs.length === 0 ? [archFromString(process.arch)] : archs) {
            archToType.set(arch, type == null ? [] : Array.isArray(type) ? type : [type]);
        }
        return new Map([[this, archToType]]);
    }
    static current() {
        return Platform.fromString(process.platform);
    }
    static fromString(name) {
        name = name.toLowerCase();
        switch (name) {
            case Platform.MAC.nodeName:
            case Platform.MAC.name:
            case "osx":
                return Platform.MAC;
            case Platform.WINDOWS.nodeName:
            case Platform.WINDOWS.name:
            case Platform.WINDOWS.buildConfigurationKey:
                return Platform.WINDOWS;
            case Platform.LINUX.nodeName:
                return Platform.LINUX;
            default:
                throw new Error(`Unknown platform: ${ name }`);
        }
    }
}
Platform.MAC = new Platform("mac", "mac", "darwin");
Platform.LINUX = new Platform("linux", "linux", "linux");
Platform.WINDOWS = new Platform("windows", "win", "win32");
// deprecated
//noinspection JSUnusedGlobalSymbols
Platform.OSX = Platform.MAC;
exports.Platform = Platform;
(function (Arch) {
    Arch[Arch["ia32"] = 0] = "ia32";
    Arch[Arch["x64"] = 1] = "x64";
    Arch[Arch["armv7l"] = 2] = "armv7l";
})(exports.Arch || (exports.Arch = {}));
var Arch = exports.Arch;
function archFromString(name) {
    if (name === "x64") {
        return Arch.x64;
    }
    if (name === "ia32") {
        return Arch.ia32;
    }
    if (name === "armv7l") {
        return Arch.armv7l;
    }
    throw new Error(`Unsupported arch ${ name }`);
}
exports.archFromString = archFromString;
//# sourceMappingURL=metadata.js.map