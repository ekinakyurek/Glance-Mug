"use strict";

const child_process_1 = require("child_process");
const bluebird_1 = require("bluebird");
const os_1 = require("os");
const path = require("path");
const fs_extra_p_1 = require("fs-extra-p");
const chalk_1 = require("chalk");
const debugFactory = require("debug");
const log_1 = require("./log");
const crypto_1 = require("crypto");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
exports.debug = debugFactory("electron-builder");
exports.debug7z = debugFactory("electron-builder:7z");
const DEFAULT_APP_DIR_NAMES = ["app", "www"];
function installDependencies(appDir, electronVersion) {
    let arch = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : process.arch;
    let forceBuildFromSource = arguments[3];
    let command = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "install";

    return log_1.task(`${ command === "install" ? "Installing" : "Rebuilding" } app dependencies for arch ${ arch } to ${ appDir }`, spawnNpmProduction(command, appDir, forceBuildFromSource, getGypEnv(electronVersion, arch)));
}
exports.installDependencies = installDependencies;
function getGypEnv(electronVersion, arch) {
    const gypHome = path.join(os_1.homedir(), ".electron-gyp");
    return Object.assign({}, process.env, {
        npm_config_disturl: "https://atom.io/download/atom-shell",
        npm_config_target: electronVersion,
        npm_config_runtime: "electron",
        npm_config_arch: arch,
        HOME: gypHome,
        USERPROFILE: gypHome
    });
}
exports.getGypEnv = getGypEnv;
function spawnNpmProduction(command, appDir, forceBuildFromSource, env) {
    let npmExecPath = process.env.npm_execpath || process.env.NPM_CLI_JS;
    const npmExecArgs = [command, "--production", "--cache-min", "999999999"];
    if (npmExecPath == null) {
        npmExecPath = process.platform === "win32" ? "npm.cmd" : "npm";
    } else {
        npmExecArgs.unshift(npmExecPath);
        npmExecPath = process.env.npm_node_execpath || process.env.NODE_EXE || "node";
    }
    if (forceBuildFromSource) {
        npmExecArgs.push("--build-from-source");
    }
    return spawn(npmExecPath, npmExecArgs, {
        cwd: appDir,
        env: env || process.env
    });
}
exports.spawnNpmProduction = spawnNpmProduction;
function removePassword(input) {
    return input.replace(/(-P |pass:|\/p|-pass )([^ ]+)/, function (match, p1, p2) {
        return `${ p1 }${ crypto_1.createHash("sha256").update(p2).digest("hex") } (sha256 hash)`;
    });
}
exports.removePassword = removePassword;
function exec(file, args, options) {
    if (exports.debug.enabled) {
        exports.debug(`Executing ${ file } ${ args == null ? "" : removePassword(args.join(" ")) }`);
    }
    return new bluebird_1.Promise((resolve, reject) => {
        child_process_1.execFile(file, args, options, function (error, stdout, stderr) {
            if (error == null) {
                if (exports.debug.enabled) {
                    if (stderr.length !== 0) {
                        log_1.log(stderr);
                    }
                    if (stdout.length !== 0) {
                        log_1.log(stdout);
                    }
                }
                resolve(stdout);
            } else {
                let message = chalk_1.red(removePassword(`Exit code: ${ error.code }. ${ error.message }`));
                if (stdout.length !== 0) {
                    message += `\n${ chalk_1.yellow(stdout) }`;
                }
                if (stderr.length !== 0) {
                    message += `\n${ chalk_1.red(stderr) }`;
                }
                reject(new Error(message));
            }
        });
    });
}
exports.exec = exec;
function doSpawn(command, args, options, pipeInput) {
    if (options == null) {
        options = {};
    }
    if (options.stdio == null) {
        options.stdio = [pipeInput ? "pipe" : "ignore", exports.debug.enabled ? "inherit" : "pipe", "pipe"];
    }
    if (exports.debug.enabled) {
        exports.debug(`Spawning ${ command } ${ removePassword(args.join(" ")) }`);
    }
    return child_process_1.spawn(command, args, options);
}
exports.doSpawn = doSpawn;
function spawn(command, args, options) {
    return new bluebird_1.Promise((resolve, reject) => {
        handleProcess("close", doSpawn(command, args || [], options), command, resolve, reject);
    });
}
exports.spawn = spawn;
function handleProcess(event, childProcess, command, resolve, reject) {
    childProcess.on("error", reject);
    let out = "";
    if (!exports.debug.enabled && childProcess.stdout != null) {
        childProcess.stdout.on("data", data => {
            out += data;
        });
    }
    let errorOut = "";
    if (childProcess.stderr != null) {
        childProcess.stderr.on("data", data => {
            errorOut += data;
        });
    }
    childProcess.once(event, code => {
        if (code === 0 && exports.debug.enabled) {
            exports.debug(`${ command } (${ childProcess.pid }) exited with code ${ code }`);
        }
        if (code !== 0) {
            function formatOut(text, title) {
                if (text.length === 0) {
                    return "";
                } else {
                    return `\n${ title }:\n${ text }`;
                }
            }
            reject(new Error(`${ command } exited with code ${ code }${ formatOut(out, "Output") }${ formatOut(errorOut, "Error output") }`));
        } else if (resolve != null) {
            resolve();
        }
    });
}
exports.handleProcess = handleProcess;
function getElectronVersion(packageData, packageJsonPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const build = packageData.build;
        // build is required, but this check is performed later, so, we should check for null
        if (build != null && build.electronVersion != null) {
            return build.electronVersion;
        }
        for (let name of ["electron", "electron-prebuilt", "electron-prebuilt-compile"]) {
            try {
                return (yield fs_extra_p_1.readJson(path.join(path.dirname(packageJsonPath), "node_modules", name, "package.json"))).version;
            } catch (e) {
                if (e.code !== "ENOENT") {
                    log_1.warn(`Cannot read electron version from ${ name } package.json: ${ e.message }`);
                }
            }
        }
        const electronPrebuiltDep = findFromElectronPrebuilt(packageData);
        if (electronPrebuiltDep == null) {
            throw new Error("Cannot find electron dependency to get electron version in the '" + packageJsonPath + "'");
        }
        const firstChar = electronPrebuiltDep[0];
        return firstChar === "^" || firstChar === "~" ? electronPrebuiltDep.substring(1) : electronPrebuiltDep;
    });
}
exports.getElectronVersion = getElectronVersion;
function findFromElectronPrebuilt(packageData) {
    for (let name of ["electron", "electron-prebuilt", "electron-prebuilt-compile"]) {
        const devDependencies = packageData.devDependencies;
        let dep = devDependencies == null ? null : devDependencies[name];
        if (dep == null) {
            const dependencies = packageData.dependencies;
            dep = dependencies == null ? null : dependencies[name];
        }
        if (dep != null) {
            return dep;
        }
    }
    return null;
}
function statOrNull(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield fs_extra_p_1.stat(file);
        } catch (e) {
            if (e.code === "ENOENT") {
                return null;
            } else {
                throw e;
            }
        }
    });
}
exports.statOrNull = statOrNull;
function computeDefaultAppDirectory(projectDir, userAppDir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userAppDir != null) {
            const absolutePath = path.resolve(projectDir, userAppDir);
            const stat = yield statOrNull(absolutePath);
            if (stat == null) {
                throw new Error(`Application directory ${ userAppDir } doesn't exists`);
            } else if (!stat.isDirectory()) {
                throw new Error(`Application directory ${ userAppDir } is not a directory`);
            } else if (projectDir === absolutePath) {
                log_1.warn(`Specified application directory "${ userAppDir }" equals to project dir — superfluous or wrong configuration`);
            }
            return absolutePath;
        }
        for (let dir of DEFAULT_APP_DIR_NAMES) {
            const absolutePath = path.join(projectDir, dir);
            const packageJson = path.join(absolutePath, "package.json");
            const stat = yield statOrNull(packageJson);
            if (stat != null && stat.isFile()) {
                return absolutePath;
            }
        }
        return projectDir;
    });
}
exports.computeDefaultAppDirectory = computeDefaultAppDirectory;
function use(value, task) {
    return value == null ? null : task(value);
}
exports.use = use;
function debug7zArgs(command) {
    const args = [command, "-bd"];
    if (exports.debug7z.enabled) {
        args.push("-bb3");
    } else if (!exports.debug.enabled) {
        args.push("-bb0");
    }
    return args;
}
exports.debug7zArgs = debug7zArgs;
let tmpDirCounter = 0;
// add date to avoid use stale temp dir
const tempDirPrefix = `${ process.pid.toString(16) }-${ Date.now().toString(16) }`;
function getTempName(prefix) {
    return `${ prefix == null ? "" : `${ prefix }-` }${ tempDirPrefix }-${ (tmpDirCounter++).toString(16) }`;
}
exports.getTempName = getTempName;
function isEmptyOrSpaces(s) {
    return s == null || s.trim().length === 0;
}
exports.isEmptyOrSpaces = isEmptyOrSpaces;
function unlinkIfExists(file) {
    return fs_extra_p_1.unlink(file).catch(() => {
        // ignore
    });
}
exports.unlinkIfExists = unlinkIfExists;
function asArray(v) {
    if (v == null) {
        return [];
    } else if (Array.isArray(v)) {
        return v;
    } else {
        return [v];
    }
}
exports.asArray = asArray;
function isCi() {
    return (process.env.CI || "").toLowerCase() === "true";
}
exports.isCi = isCi;
//# sourceMappingURL=util.js.map