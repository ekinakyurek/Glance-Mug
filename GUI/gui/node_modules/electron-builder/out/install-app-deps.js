#! /usr/bin/env node

"use strict";

const util_1 = require("./util/util");
const promise_1 = require("./util/promise");
const path = require("path");
const bluebird_1 = require("bluebird");
const yargs = require("yargs");
const readPackageJson_1 = require("./util/readPackageJson");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
const args = yargs.option("arch", {
    choices: ["ia32", "x64", "all"]
}).argv;
const projectDir = process.cwd();
const devPackageFile = path.join(projectDir, "package.json");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const devMetadata = yield readPackageJson_1.readPackageJson(devPackageFile);
        const results = yield bluebird_1.Promise.all([util_1.computeDefaultAppDirectory(projectDir, util_1.use(devMetadata.directories, it => it.app)), util_1.getElectronVersion(devMetadata, devPackageFile)]);
        if (results[0] === projectDir) {
            throw new Error("install-app-deps is only useful for two package.json structure");
        }
        yield util_1.installDependencies(results[0], results[1], args.arch, devMetadata.build.npmSkipBuildFromSource !== true);
    });
}
main().catch(promise_1.printErrorAndExit);
//# sourceMappingURL=install-app-deps.js.map