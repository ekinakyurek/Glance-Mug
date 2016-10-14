var Mic = require('node-microphone');
var mic = new Mic();
var micStream = mic.startRecording();
var fs = require('fs');
var myWritableStream = fs.createWriteStream("deneme.waw",{ flags: 'a' })
micStream.pipe( myWritableStream );
setTimeout(() => {
    console.log('stopped recording');
    mic.stopRecording();
}, 3000);
mic.on('info', (info) => {
    console.log(info);
});
mic.on('error', (error) => {
    console.log(error);
});
