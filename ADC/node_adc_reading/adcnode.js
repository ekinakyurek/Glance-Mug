var ads1x15 = require('node-ads1x15');
var regression = require('./regression')

var chip = 1; //0 for ads1015, 1 for ads1115
//Simple usage (default ADS address on pi 2b or 3):
var adc = new ads1x15(chip);

// Optionally i2c address as (chip, address) or (chip, address, i2c_dev)
// So to use  /dev/i2c-0 use the line below instead...:

//    var adc = new ads1x15(chip, 0x48, 'dev/i2c-0');

var channel = 0; //channel 0, 1, 2, or 3...
var samplesPerSecond = '860'; // see index.js for allowed values for your chip
var progGainAmp = '4096'; // see index.js for allowed values for your chip
var gestureArray = [];
//somewhere to store our reading
var reading  = 0;

if(!adc.busy){


    adc.startContinuousConversion(channel, progGainAmp, samplesPerSecond, function(err,data) {
        if(err)
        {
            //logging / troubleshooting code goes here...
            throw err;
        }
        delay = 1000 / samplesPerSecond;

        setInterval(readinglopp, delay)
        // if you made it here, then the data object contains your reading!

        // any other data processing code goes here...
    })
}

var readinglopp = function(){
    adc.getLastConversionResults(progGainAmp,function(err,data){
        data /= 3200
	data = data<0 ? 0:data
        gestureArray.push([gestureArray.length,data])
        // console.log(data)
        if(gestureArray.length%20==0){
   	    var test_data = [[0,1],[1,2], [2,3], [3,4]]
            //var result = regression('linear',test_data);
	    var result = regression('linear', gestureArray)
	    //console.log("slope: " + result.equation[0]);
	    //console.log("correlation: " + result.equation[2]);
	    if(result.equation[0] > 0.0004 && result.equation[2] > 0.95) {
                console.log("swipe up")
                console.log("slope: " + result.equation[0]);
                console.log("correlation: " + result.equation[2]);
            }else if(result.equation[0] < -0.0004 && result.equation[2] < -0.95){
                console.log("swipe down")
                console.log("slope: " + result.equation[0]);
                console.log("correlation: " + result.equation[2]);
            }
            gestureArray.length = 0;
        }


    });
}
