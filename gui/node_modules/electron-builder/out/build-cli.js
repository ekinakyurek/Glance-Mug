#! /usr/bin/env node

"use strict";

const builder_1 = require("./builder");
const promise_1 = require("./util/promise");
const cliOptions_1 = require("./cliOptions");
const fs_extra_p_1 = require("fs-extra-p");
const path = require("path");
const chalk_1 = require("chalk");
const updateNotifier = require("update-notifier");
const log_1 = require("./util/log");
if (process.env.CI == null && process.env.NO_UPDATE_NOTIFIER == null) {
    fs_extra_p_1.readJson(path.join(__dirname, "..", "package.json")).then(it => {
        const notifier = updateNotifier({ pkg: it });
        if (notifier.update != null) {
            notifier.notify({
                message: `Update available ${ chalk_1.dim(notifier.update.current) }${ chalk_1.reset(" → ") }${ chalk_1.green(notifier.update.latest) } \nRun ${ chalk_1.cyan("npm i electron-builder --save-dev") } to update`
            });
        }
    }).catch(e => log_1.warn(`Cannot check updates: ${ e }`));
}
builder_1.build(cliOptions_1.createYargs().argv).catch(promise_1.printErrorAndExit);
//# sourceMappingURL=build-cli.js.map