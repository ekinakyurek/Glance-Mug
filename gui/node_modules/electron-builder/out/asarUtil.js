"use strict";

const asar_electron_builder_1 = require("asar-electron-builder");
const util_1 = require("./util/util");
const fs_extra_p_1 = require("fs-extra-p");
const bluebird_1 = require("bluebird");
const path = require("path");
const log_1 = require("./util/log");
const minimatch_1 = require("minimatch");
const deepAssign_1 = require("./util/deepAssign");
const isBinaryFile = bluebird_1.Promise.promisify(require("isbinaryfile"));
const pickle = require("chromium-pickle-js");
const Filesystem = require("asar-electron-builder/lib/filesystem");
const UINT64 = require("cuint").UINT64;
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
const MAX_FILE_REQUESTS = 32;
const concurrency = { concurrency: MAX_FILE_REQUESTS };
const NODE_MODULES_PATTERN = path.sep + "node_modules" + path.sep;
function walk(dirPath, consumer, filter, addRootToResult) {
    return fs_extra_p_1.readdir(dirPath).then(names => bluebird_1.Promise.map(names, name => {
        const filePath = dirPath + path.sep + name;
        return fs_extra_p_1.lstat(filePath).then(stat => {
            if (filter != null && !filter(filePath, stat)) {
                return null;
            }
            if (consumer != null) {
                consumer(filePath, stat);
            }
            if (stat.isDirectory()) {
                return walk(filePath, consumer, filter, true);
            }
            return filePath;
        });
    }, concurrency)).then(list => {
        list.sort((a, b) => {
            // files before directories
            if (Array.isArray(a) && Array.isArray(b)) {
                return 0;
            } else if (a == null || Array.isArray(a)) {
                return 1;
            } else if (b == null || Array.isArray(b)) {
                return -1;
            } else {
                return a.localeCompare(b);
            }
        });
        const result = addRootToResult ? [dirPath] : [];
        for (let item of list) {
            if (item != null) {
                if (Array.isArray(item)) {
                    result.push.apply(result, item);
                } else {
                    result.push(item);
                }
            }
        }
        return result;
    });
}
exports.walk = walk;
function createAsarArchive(src, resourcesPath, options, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        // sort files to minimize file change (i.e. asar file is not changed dramatically on small change)
        yield new AsarPackager(src, resourcesPath, options).pack(filter);
    });
}
exports.createAsarArchive = createAsarArchive;
function isUnpackDir(path, pattern, rawPattern) {
    return path.startsWith(rawPattern) || pattern.match(path);
}
class AsarPackager {
    constructor(src, resourcesPath, options) {
        this.src = src;
        this.resourcesPath = resourcesPath;
        this.options = options;
        this.toPack = [];
        this.fs = new Filesystem(this.src);
        this.changedFiles = new Map();
        this.outFile = path.join(this.resourcesPath, "app.asar");
    }
    pack(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadata = new Map();
            const files = yield walk(this.src, (it, stat) => {
                metadata.set(it, stat);
            }, filter);
            yield this.createPackageFromFiles(this.options.ordering == null ? files : yield this.order(files), metadata);
            yield this.writeAsarFile();
        });
    }
    getSrcRealPath() {
        if (this.srcRealPath == null) {
            this.srcRealPath = fs_extra_p_1.realpath(this.src);
        }
        return this.srcRealPath;
    }
    detectUnpackedDirs(files, metadata, autoUnpackDirs, createDirPromises, unpackedDest, fileIndexToModulePackageData) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageJsonStringLength = "package.json".length;
            const readPackageJsonPromises = [];
            for (let i = 0, n = files.length; i < n; i++) {
                const file = files[i];
                const index = file.lastIndexOf(NODE_MODULES_PATTERN);
                if (index < 0) {
                    continue;
                }
                const nextSlashIndex = file.indexOf(path.sep, index + NODE_MODULES_PATTERN.length + 1);
                if (nextSlashIndex < 0) {
                    continue;
                }
                if (!metadata.get(file).isFile()) {
                    continue;
                }
                const nodeModuleDir = file.substring(0, nextSlashIndex);
                if (file.length === nodeModuleDir.length + 1 + packageJsonStringLength && file.endsWith("package.json")) {
                    const promise = fs_extra_p_1.readJson(file);
                    if (readPackageJsonPromises.length > MAX_FILE_REQUESTS) {
                        yield bluebird_1.Promise.all(readPackageJsonPromises);
                        readPackageJsonPromises.length = 0;
                    }
                    readPackageJsonPromises.push(promise);
                    fileIndexToModulePackageData[i] = promise;
                }
                if (autoUnpackDirs.has(nodeModuleDir)) {
                    const fileParent = path.dirname(file);
                    if (fileParent !== nodeModuleDir && !autoUnpackDirs.has(fileParent)) {
                        autoUnpackDirs.add(fileParent);
                        createDirPromises.push(fs_extra_p_1.ensureDir(path.join(unpackedDest, path.relative(this.src, fileParent))));
                        if (createDirPromises.length > MAX_FILE_REQUESTS) {
                            yield bluebird_1.Promise.all(createDirPromises);
                            createDirPromises.length = 0;
                        }
                    }
                    continue;
                }
                const ext = path.extname(file);
                let shouldUnpack = false;
                if (ext === ".dll" || ext === ".exe") {
                    shouldUnpack = true;
                } else if (ext === "") {
                    shouldUnpack = yield isBinaryFile(file);
                }
                if (!shouldUnpack) {
                    continue;
                }
                log_1.log(`${ path.relative(this.src, nodeModuleDir) } is not packed into asar archive - contains executable code`);
                let fileParent = path.dirname(file);
                // create parent dir to be able to copy file later without directory existence check
                createDirPromises.push(fs_extra_p_1.ensureDir(path.join(unpackedDest, path.relative(this.src, fileParent))));
                if (createDirPromises.length > MAX_FILE_REQUESTS) {
                    yield bluebird_1.Promise.all(createDirPromises);
                    createDirPromises.length = 0;
                }
                while (fileParent !== nodeModuleDir) {
                    autoUnpackDirs.add(fileParent);
                    fileParent = path.dirname(fileParent);
                }
                autoUnpackDirs.add(nodeModuleDir);
            }
            if (readPackageJsonPromises.length > 0) {
                yield bluebird_1.Promise.all(readPackageJsonPromises);
            }
            if (createDirPromises.length > 0) {
                yield bluebird_1.Promise.all(createDirPromises);
                createDirPromises.length = 0;
            }
        });
    }
    createPackageFromFiles(files, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            // search auto unpacked dir
            const autoUnpackDirs = new Set();
            const createDirPromises = [fs_extra_p_1.ensureDir(path.dirname(this.outFile))];
            const unpackedDest = `${ this.outFile }.unpacked`;
            const fileIndexToModulePackageData = new Array(files.length);
            if (this.options.smartUnpack !== false) {
                yield this.detectUnpackedDirs(files, metadata, autoUnpackDirs, createDirPromises, unpackedDest, fileIndexToModulePackageData);
            }
            const unpackDir = this.options.unpackDir == null ? null : new minimatch_1.Minimatch(this.options.unpackDir);
            const unpack = this.options.unpack == null ? null : new minimatch_1.Minimatch(this.options.unpack, {
                matchBase: true
            });
            const copyPromises = [];
            const mainPackageJson = path.join(this.src, "package.json");
            for (let i = 0, n = files.length; i < n; i++) {
                const file = files[i];
                const stat = metadata.get(file);
                if (stat.isFile()) {
                    const fileParent = path.dirname(file);
                    const dirNode = this.fs.searchNodeFromPath(fileParent);
                    if (dirNode.unpacked && createDirPromises.length > 0) {
                        yield bluebird_1.Promise.all(createDirPromises);
                        createDirPromises.length = 0;
                    }
                    const packageDataPromise = fileIndexToModulePackageData[i];
                    let newData = null;
                    if (packageDataPromise == null) {
                        if (this.options.extraMetadata != null && file === mainPackageJson) {
                            newData = JSON.stringify(deepAssign_1.deepAssign((yield fs_extra_p_1.readJson(file)), this.options.extraMetadata), null, 2);
                        }
                    } else {
                        newData = cleanupPackageJson(packageDataPromise.value());
                    }
                    const fileSize = newData == null ? stat.size : Buffer.byteLength(newData);
                    const node = this.fs.searchNodeFromPath(file);
                    node.size = fileSize;
                    if (dirNode.unpacked || unpack != null && unpack.match(file)) {
                        node.unpacked = true;
                        if (!dirNode.unpacked) {
                            createDirPromises.push(fs_extra_p_1.ensureDir(path.join(unpackedDest, path.relative(this.src, fileParent))));
                            yield bluebird_1.Promise.all(createDirPromises);
                            createDirPromises.length = 0;
                        }
                        const unpackedFile = path.join(unpackedDest, path.relative(this.src, file));
                        copyPromises.push(newData == null ? copyFile(file, unpackedFile, stat) : fs_extra_p_1.writeFile(unpackedFile, newData));
                        if (copyPromises.length > MAX_FILE_REQUESTS) {
                            yield bluebird_1.Promise.all(copyPromises);
                            copyPromises.length = 0;
                        }
                    } else {
                        if (newData != null) {
                            this.changedFiles.set(file, newData);
                        }
                        if (fileSize > 4294967295) {
                            throw new Error(`${ file }: file size can not be larger than 4.2GB`);
                        }
                        node.offset = this.fs.offset.toString();
                        //noinspection JSBitwiseOperatorUsage
                        if (process.platform !== "win32" && stat.mode & 0x40) {
                            node.executable = true;
                        }
                        this.toPack.push(file);
                        this.fs.offset.add(UINT64(fileSize));
                    }
                } else if (stat.isDirectory()) {
                    let unpacked = false;
                    if (autoUnpackDirs.has(file)) {
                        unpacked = true;
                    } else {
                        unpacked = unpackDir != null && isUnpackDir(path.relative(this.src, file), unpackDir, this.options.unpackDir);
                        if (unpacked) {
                            createDirPromises.push(fs_extra_p_1.ensureDir(path.join(unpackedDest, path.relative(this.src, file))));
                        } else {
                            for (let d of autoUnpackDirs) {
                                if (file.length > d.length + 2 && file[d.length] === path.sep && file.startsWith(d)) {
                                    unpacked = true;
                                    autoUnpackDirs.add(file);
                                    // not all dirs marked as unpacked after first iteration - because node module dir can be marked as unpacked after processing node module dir content
                                    // e.g. node-notifier/example/advanced.js processed, but only on process vendor/terminal-notifier.app module will be marked as unpacked
                                    createDirPromises.push(fs_extra_p_1.ensureDir(path.join(unpackedDest, path.relative(this.src, file))));
                                    break;
                                }
                            }
                        }
                    }
                    this.fs.insertDirectory(file, unpacked);
                } else if (stat.isSymbolicLink()) {
                    yield this.addLink(file);
                }
            }
            yield bluebird_1.Promise.all(copyPromises);
        });
    }
    addLink(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const realFile = yield fs_extra_p_1.realpath(file);
            const link = path.relative((yield this.getSrcRealPath()), realFile);
            if (link.startsWith("..")) {
                throw new Error(realFile + ": file links out of the package");
            } else {
                this.fs.searchNodeFromPath(file).link = link;
            }
        });
    }
    writeAsarFile() {
        const headerPickle = pickle.createEmpty();
        headerPickle.writeString(JSON.stringify(this.fs.header));
        const headerBuf = headerPickle.toBuffer();
        const sizePickle = pickle.createEmpty();
        sizePickle.writeUInt32(headerBuf.length);
        const sizeBuf = sizePickle.toBuffer();
        const writeStream = fs_extra_p_1.createWriteStream(this.outFile);
        return new bluebird_1.Promise((resolve, reject) => {
            writeStream.on("error", reject);
            writeStream.once("finish", resolve);
            writeStream.write(sizeBuf);
            let w;
            w = (list, index) => {
                if (list.length === index) {
                    writeStream.end();
                    return;
                }
                const file = list[index];
                const data = this.changedFiles.get(file);
                if (data != null) {
                    writeStream.write(data, () => w(list, index + 1));
                    return;
                }
                const readStream = fs_extra_p_1.createReadStream(file);
                readStream.on("error", reject);
                readStream.once("end", () => w(list, index + 1));
                readStream.pipe(writeStream, {
                    end: false
                });
            };
            writeStream.write(headerBuf, () => w(this.toPack, 0));
        });
    }
    order(filenames) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderingFiles = (yield fs_extra_p_1.readFile(this.options.ordering, "utf8")).split("\n").map(line => {
                if (line.indexOf(":") !== -1) {
                    line = line.split(":").pop();
                }
                line = line.trim();
                if (line[0] === "/") {
                    line = line.slice(1);
                }
                return line;
            });
            const ordering = [];
            for (let file of orderingFiles) {
                let pathComponents = file.split(path.sep);
                let str = this.src;
                for (let pathComponent of pathComponents) {
                    str = path.join(str, pathComponent);
                    ordering.push(str);
                }
            }
            const filenamesSorted = [];
            let missing = 0;
            const total = filenames.length;
            for (let file of ordering) {
                if (!(filenamesSorted.indexOf(file) !== -1) && filenames.indexOf(file) !== -1) {
                    filenamesSorted.push(file);
                }
            }
            for (let file of filenames) {
                if (!(filenamesSorted.indexOf(file) !== -1)) {
                    filenamesSorted.push(file);
                    missing += 1;
                }
            }
            log_1.log(`Ordering file has ${ (total - missing) / total * 100 }% coverage.`);
            return filenamesSorted;
        });
    }
}
function cleanupPackageJson(data) {
    try {
        let changed = false;
        for (let prop of Object.getOwnPropertyNames(data)) {
            if (prop[0] === "_" || prop === "dist" || prop === "gitHead" || prop === "keywords") {
                delete data[prop];
                changed = true;
            }
        }
        if (changed) {
            return JSON.stringify(data, null, 2);
        }
    } catch (e) {
        util_1.debug(e);
    }
    return null;
}
function checkFileInArchive(asarFile, relativeFile, messagePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        function error(text) {
            return new Error(`${ messagePrefix } "${ relativeFile }" in the "${ asarFile }" ${ text }`);
        }
        let stat;
        try {
            stat = asar_electron_builder_1.statFile(asarFile, relativeFile);
        } catch (e) {
            const fileStat = yield util_1.statOrNull(asarFile);
            if (fileStat == null) {
                throw error(`does not exist. Seems like a wrong configuration.`);
            }
            try {
                asar_electron_builder_1.listPackage(asarFile);
            } catch (e) {
                throw error(`is corrupted: ${ e }`);
            }
            // asar throws error on access to undefined object (info.link)
            stat = null;
        }
        if (stat == null) {
            throw error(`does not exist. Seems like a wrong configuration.`);
        }
        if (stat.size === 0) {
            throw error(`is corrupted: size 0`);
        }
    });
}
exports.checkFileInArchive = checkFileInArchive;
function copyFile(src, dest, stats) {
    return new bluebird_1.Promise(function (resolve, reject) {
        const readStream = fs_extra_p_1.createReadStream(src);
        const writeStream = fs_extra_p_1.createWriteStream(dest, { mode: stats.mode });
        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("open", function () {
            readStream.pipe(writeStream);
        });
        writeStream.once("finish", resolve);
    });
}
//# sourceMappingURL=asarUtil.js.map