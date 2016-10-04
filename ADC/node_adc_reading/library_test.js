/**
 * Created by ekin on 04/10/2016.
 */
var gesture = require("./gesture")
var EventEmitter = require("events").EventEmitter;
var ee = new EventEmitter();
var gesture_recognizer = new gesture(1,0,4096,860)

ee.on("swipe-up", function () {
    console.log("event has occured");
});


gesture_recognizer.startReading(ee)