/**
 * Created by ekin on 04/10/2016.
 */
//Inlude gesture and event libraries
var gesture = require("./node_modules/gesture")
var EventEmitter = require("events").EventEmitter;
//create eventEmitter and gesture_recognizer objects.
var ee = new EventEmitter();
var gesture_recognizer = new gesture(1,0,'4096','860')

//Event handler functions
ee.on("swipe-up,0", function (data) {
    console.log("0:swipe_up gesture is called, velocity:" + data);
});

ee.on("swipe-down,0", function (data) {
    console.log("0:swipe_down gesture is called, velocity:" + data);
});

ee.on("click-event,0", function (data) {
    console.log("0:click detected at point:" + data);
});

ee.on("swipe-up,1", function (data) {
    console.log("1:swipe_up gesture is called, velocity:" + data);
});

ee.on("swipe-down,1", function (data) {
    console.log("1:swipe_down gesture is called, velocity:" + data);
});

ee.on("click-event,1", function (data) {
    console.log("1:click detected at point:" + data);
});
gesture_recognizer.startMultiChannelReading(ee,[0,1]);
