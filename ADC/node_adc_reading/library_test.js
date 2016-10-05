/**
 * Created by ekin on 04/10/2016.
 */
//Inlude gesture and event libraries
var gesture = require("./gesture")
var EventEmitter = require("events").EventEmitter;
//create eventEmitter and gesture_recognizer objects.
var ee = new EventEmitter();
var gesture_recognizer = new gesture(1,0,'4096','860')

//Event handler functions
ee.on("swipe-up", function () {
    console.log("swipe_up gesture is called");
});
ee.on("swipe-down", function () {
    console.log("swipe_down gesture is called");
});
ee.on("point-detection", function () {
    console.log("point detected at point: data ");
});


gesture_recognizer.startReading(ee);
