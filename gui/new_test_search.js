//For logging/////
var fs = require('fs');
var util = require('util');
var user_date = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '')
var log_file = fs.createWriteStream(__dirname + '/debugs/' + user_date + '.debug', {flags : 'w'});
var log_stdout = process.stdout;


var my_console_log = function(d) { //
var date = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '') + ": "
        if (util!=null) {
                log_file.write(date + util.format(d) + '\n');
                log_stdout.write(date + util.format(d) + '\n');
        }else{
                console.log(d);
        }
};

var event_emitter = require('events').EventEmitter;
var kg_ee = new event_emitter();
var k = 0 ;
var search = require('./web_search_new.js');
var data=fs.readFileSync('data.json');
var test_input=JSON.parse(data);

search.starter(test_input,true,kg_ee, my_console_log)

kg_ee.on("result", function (data) {
	console.log('result no:' + k);
});

kg_ee.on('error_occurs', function(data){
	 console.log('error:');
});

kg_ee.on("finished", function (data) {
	console.log('It is finished:')
});

kg_ee.on('error', function(error){
	console.log('acaba error');
})
