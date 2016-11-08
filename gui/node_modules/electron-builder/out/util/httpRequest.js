"use strict";

const https = require("https");
const fs_extra_p_1 = require("fs-extra-p");
const url_1 = require("url");
const bluebird_1 = require("bluebird");
const path = require("path");
const crypto_1 = require("crypto");
const stream_1 = require("stream");
const os_1 = require("os");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
const maxRedirects = 10;
let httpsAgent = null;
function download(url, destination, options) {
    return (httpsAgent || (httpsAgent = createAgent())).then(it => new bluebird_1.Promise(function (resolve, reject) {
        doDownload(url, destination, 0, options || {}, it, error => {
            if (error == null) {
                resolve(destination);
            } else {
                reject(error);
            }
        });
    }));
}
exports.download = download;
function addTimeOutHandler(request, callback) {
    request.on("socket", function (socket) {
        socket.setTimeout(60 * 1000, () => {
            callback(new Error("Request timed out"));
            request.abort();
        });
    });
}
exports.addTimeOutHandler = addTimeOutHandler;
function doDownload(url, destination, redirectCount, options, agent, callback) {
    const ensureDirPromise = options.skipDirCreation ? bluebird_1.Promise.resolve() : fs_extra_p_1.ensureDir(path.dirname(destination));
    const parsedUrl = url_1.parse(url);
    // user-agent must be specified, otherwise some host can return 401 unauthorised
    const request = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        headers: {
            "User-Agent": "electron-builder"
        },
        agent: agent
    }, response => {
        if (response.statusCode >= 400) {
            callback(new Error(`Cannot download "${ url }", status ${ response.statusCode }: ${ response.statusMessage }`));
            return;
        }
        const redirectUrl = response.headers.location;
        if (redirectUrl != null) {
            if (redirectCount < maxRedirects) {
                doDownload(redirectUrl, destination, redirectCount++, options, agent, callback);
            } else {
                callback(new Error("Too many redirects (> " + maxRedirects + ")"));
            }
            return;
        }
        const sha2Header = response.headers["X-Checksum-Sha2"];
        if (sha2Header != null && options.sha2 != null) {
            // todo why bintray doesn't send this header always
            if (sha2Header == null) {
                throw new Error("checksum is required, but server response doesn't contain X-Checksum-Sha2 header");
            } else if (sha2Header !== options.sha2) {
                throw new Error(`checksum mismatch: expected ${ options.sha2 } but got ${ sha2Header } (X-Checksum-Sha2 header)`);
            }
        }
        ensureDirPromise.then(() => {
            const fileOut = fs_extra_p_1.createWriteStream(destination);
            if (options.sha2 == null) {
                response.pipe(fileOut);
            } else {
                response.pipe(new DigestTransform(options.sha2)).pipe(fileOut);
            }
            fileOut.on("finish", () => fileOut.close(callback));
        }).catch(callback);
        let ended = false;
        response.on("end", () => {
            ended = true;
        });
        response.on("close", () => {
            if (!ended) {
                callback(new Error("Request aborted"));
            }
        });
    });
    addTimeOutHandler(request, callback);
    request.on("error", callback);
    request.end();
}
class DigestTransform extends stream_1.Transform {
    constructor(expected) {
        super();
        this.expected = expected;
        this.digester = crypto_1.createHash("sha256");
    }
    _transform(chunk, encoding, callback) {
        this.digester.update(chunk);
        callback(null, chunk);
    }
    _flush(callback) {
        const hash = this.digester.digest("hex");
        callback(hash === this.expected ? null : new Error(`SHA2 checksum mismatch, expected ${ this.expected }, got ${ hash }`));
    }
}
// only https proxy
function proxyFromNpm() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = "";
        try {
            data = yield fs_extra_p_1.readFile(path.join(os_1.homedir(), ".npmrc"), "utf-8");
        } catch (ignored) {
            return null;
        }
        if (!data) {
            return null;
        }
        try {
            const config = require("ini").parse(data);
            return config["https-proxy"] || config.proxy;
        } catch (e) {
            // used in nsis auto-updater, do not use .util.warn here
            console.warn(e);
            return null;
        }
    });
}
// only https url
function createAgent() {
    return __awaiter(this, void 0, void 0, function* () {
        let proxyString = process.env.npm_config_https_proxy || process.env.HTTPS_PROXY || process.env.https_proxy || process.env.npm_config_proxy;
        if (!proxyString) {
            proxyString = yield proxyFromNpm();
            if (!proxyString) {
                return null;
            }
        }
        const proxy = url_1.parse(proxyString);
        const proxyProtocol = proxy.protocol === "https:" ? "Https" : "Http";
        return require("tunnel-agent")[`httpsOver${ proxyProtocol }`]({
            proxy: {
                port: proxy.port || (proxyProtocol === "Https" ? 443 : 80),
                host: proxy.hostname,
                proxyAuth: proxy.auth
            }
        });
    });
}
//# sourceMappingURL=httpRequest.js.map