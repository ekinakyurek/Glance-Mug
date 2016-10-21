"use strict";

const https = require("https");
const httpRequest_1 = require("../util/httpRequest");
const bluebird_1 = require("bluebird");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("../util/awaiter");
function githubRequest(path, token) {
    let data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    let method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "GET";

    return request("api.github.com", path, token, data, method);
}
exports.githubRequest = githubRequest;
function bintrayRequest(path, auth) {
    let data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    let method = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "GET";

    return request("api.bintray.com", path, auth, data, method);
}
exports.bintrayRequest = bintrayRequest;
function request(hostname, path, token) {
    let data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    let method = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "GET";

    const options = {
        hostname: hostname,
        path: path,
        method: method,
        headers: {
            "User-Agent": "electron-builder"
        }
    };
    if (hostname.indexOf("github") !== -1) {
        options.headers.Accept = "application/vnd.github.v3+json";
    }
    const encodedData = data == null ? null : new Buffer(JSON.stringify(data));
    if (encodedData != null) {
        options.method = "post";
        options.headers["Content-Type"] = "application/json";
        options.headers["Content-Length"] = encodedData.length;
    }
    return doApiRequest(options, token, it => it.end(encodedData));
}
function doApiRequest(options, token, requestProcessor) {
    if (token != null) {
        options.headers.authorization = token.startsWith("Basic") ? token : `token ${ token }`;
    }
    return new bluebird_1.Promise((resolve, reject, onCancel) => {
        const request = https.request(options, response => {
            try {
                if (response.statusCode === 404) {
                    // error is clear, we don't need to read detailed error description
                    reject(new HttpError(response, `method: ${ options.method } url: https://${ options.hostname }${ options.path }

Please double check that your authentication token is correct. Due to security reasons actual status maybe not reported, but 404.
`));
                } else if (response.statusCode === 204) {
                    // on DELETE request
                    resolve();
                    return;
                }
                let data = "";
                response.setEncoding("utf8");
                response.on("data", chunk => {
                    data += chunk;
                });
                response.on("end", () => {
                    try {
                        if (response.statusCode >= 400) {
                            const contentType = response.headers["content-type"];
                            if (contentType != null && contentType.indexOf("json") !== -1) {
                                reject(new HttpError(response, JSON.parse(data)));
                            } else {
                                reject(new HttpError(response));
                            }
                        } else {
                            resolve(data.length === 0 ? null : JSON.parse(data));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
        httpRequest_1.addTimeOutHandler(request, reject);
        request.on("error", reject);
        requestProcessor(request, reject);
        onCancel(() => request.abort());
    });
}
exports.doApiRequest = doApiRequest;
class HttpError extends Error {
    constructor(response) {
        let description = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        super(response.statusCode + " " + response.statusMessage + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + JSON.stringify(response.headers, null, "  "));
        this.response = response;
        this.description = description;
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=restApiRequest.js.map