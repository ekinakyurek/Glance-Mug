"use strict";

const path = require("path");
const fs_extra_p_1 = require("fs-extra-p");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./awaiter");
const normalizeData = require("normalize-package-data");
function readPackageJson(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs_extra_p_1.readJson(file);
        yield authors(file, data);
        normalizeData(data);
        return data;
    });
}
exports.readPackageJson = readPackageJson;
function authors(file, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (data.contributors != null) {
            return;
        }
        let authorData = null;
        try {
            authorData = yield fs_extra_p_1.readFile(path.resolve(path.dirname(file), "AUTHORS"), "utf8");
        } catch (ignored) {
            return;
        }
        data.contributors = authorData.split(/\r?\n/g).map(it => it.replace(/^\s*#.*$/, "").trim());
    });
}
//# sourceMappingURL=readPackageJson.js.map