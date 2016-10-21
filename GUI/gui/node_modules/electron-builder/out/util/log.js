"use strict";

const chalk_1 = require("chalk");
const ansi_escapes_1 = require("ansi-escapes");
const cursor = require("cli-cursor");
const prettyMs = require("pretty-ms");
class SimpleLine {
    //noinspection JSUnusedGlobalSymbols
    constructor(text, promise) {
        this.text = text;
        this.promise = promise;
    }
}
class Task {
    constructor(text, rawText, promise) {
        this.text = text;
        this.rawText = rawText;
        this.promise = promise;
        this.start = process.hrtime();
    }
    done() {
        const duration = process.hrtime(this.start);
        const ms = duration[0] * 1000 + duration[1] / 1e6;
        this.text = `${ this.rawText } ${ chalk_1.green(prettyMs(ms)) }\n`;
    }
}
class Logger {
    constructor(stream) {
        this.stream = stream;
        this.lines = [];
        this.logTime = process.env.LOG_TIME === "true";
    }
    warn(message) {
        this.log(chalk_1.yellow(`Warning: ${ message }`));
    }
    log(message) {
        const text = `${ message }\n`;
        if (this.lines.length === 0) {
            this.stream.write(text);
        } else {
            this.lines.push(new SimpleLine(text));
            this.render();
        }
    }
    subTask(title, _promise) {
        if (!this.logTime) {
            return _promise;
        }
        return this.task(title, _promise);
    }
    task(title, _promise) {
        const promise = _promise;
        if (!this.logTime) {
            this.log(`${ title }\n`);
            return promise;
        }
        const task = new Task(chalk_1.blue(title) + "\n", title, promise);
        this.lines.push(task);
        promise.then(() => {
            task.done();
            this.render();
        });
        this.render();
        return promise;
    }
    render() {
        const prevLineCount = this.lines.length;
        if (prevLineCount === 0) {
            cursor.show();
            return;
        }
        cursor.hide();
        let out = "";
        let firstPendingLineIndex = 0;
        while (firstPendingLineIndex < prevLineCount) {
            let line = this.lines[firstPendingLineIndex];
            if (line.promise == null || !line.promise.isPending()) {
                out += line.text;
                firstPendingLineIndex++;
            } else {
                break;
            }
        }
        if (firstPendingLineIndex > 0) {
            if (this.lines.length === firstPendingLineIndex) {
                this.lines.length = 0;
                this.stream.write(ansi_escapes_1.eraseLines(prevLineCount) + out);
                cursor.show();
                return;
            }
            this.lines.splice(0, firstPendingLineIndex);
        }
        for (let line of this.lines) {
            out += line.text;
        }
        this.stream.write(ansi_escapes_1.eraseLines(prevLineCount) + out);
    }
}
const logger = new Logger(process.stdout);
function warn(message) {
    logger.warn(message);
}
exports.warn = warn;
function log(message) {
    logger.log(message);
}
exports.log = log;
function subTask(title, promise) {
    return logger.subTask(title, promise);
}
exports.subTask = subTask;
function task(title, promise) {
    return logger.task(title, promise);
}
exports.task = task;
//# sourceMappingURL=log.js.map