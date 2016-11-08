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
ee.on("swipe-up", function (data) {
    console.log("swipe_up gesture is called, velocity:" + data);
});  

ee.on("swipe-down", function (data) {
    console.log("swipe_down gesture is called, velocity:" + data);
});

ee.on("click-detection", function (data) {
    console.log("click detected at point:" + data);
});


gesture_recognizer.startReading(ee);
