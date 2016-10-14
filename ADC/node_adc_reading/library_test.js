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
    var fs = require('fs');
    var path = '/home/pi/.config/electron-quick-start/test.json';
    fs.writeFile(path, data, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
    }); 
}); 

ee.on("swipe-down", function (data) {
    console.log("swipe_down gesture is called, velocity:" + data);
});

ee.on("point-detection", function (data) {
    console.log("point detected at point:" + data);
    var fs = require('fs');
    var path = '/home/pi/.config/electron-quick-start/test.json';
    fs.writeFile(path, data, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
    });
});


gesture_recognizer.startReading(ee)
