"use strict";

const progressStream = require("progress-stream");
const ProgressBar = require("progress");
const fs_extra_p_1 = require("fs-extra-p");
function uploadFile(file, fileStat, fileName, request, reject) {
    const progressBar = process.stdin.isTTY ? new ProgressBar(`Uploading ${ fileName } [:bar] :percent :etas`, {
        total: fileStat.size,
        incomplete: " ",
        stream: process.stdout,
        width: 20
    }) : null;
    const fileInputStream = fs_extra_p_1.createReadStream(file);
    fileInputStream.on("error", reject);
    fileInputStream.pipe(progressStream({
        length: fileStat.size,
        time: 1000
    }, progress => {
        if (progressBar != null) {
            progressBar.tick(progress.delta);
        }
    })).pipe(request);
}
exports.uploadFile = uploadFile;
//# sourceMappingURL=uploader.js.map