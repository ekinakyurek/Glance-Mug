#! /usr/bin/env node

"use strict";

const util_1 = require("./util/util");
const promise_1 = require("./util/promise");
const path = require("path");
const yargs = require("yargs");
const readPackageJson_1 = require("./util/readPackageJson");
const log_1 = require("./util/log");
//noinspection JSUnusedLocalSymbols
const __awaiter = require("./util/awaiter");
const args = yargs.option("arch", {
    choices: ["ia32", "x64", "armv7l"]
}).argv;
const projectDir = process.cwd();
const devPackageFile = path.join(projectDir, "package.json");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const arch = args.arch || process.arch;
        log_1.log(`Execute node-gyp rebuild for arch ${ arch }`);
        yield util_1.exec(process.platform === "win32" ? "node-gyp.cmd" : "node-gyp", ["rebuild"], {
            env: util_1.getGypEnv((yield util_1.getElectronVersion((yield readPackageJson_1.readPackageJson(devPackageFile)), devPackageFile)), arch)
        });
    });
}
main().catch(promise_1.printErrorAndExit);
//# sourceMappingURL=node-gyp-rebuild.js.map