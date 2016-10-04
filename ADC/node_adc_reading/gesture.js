var ads1x15 = require('node-ads1x15');
var regression = require('./regression')
function gesture(chip, channel, pga, sps) {

        this.chip = chip
        this.channel = channel
        this.pga == pga
        this.sps = sps
        this.gestureArray = [];
        this.adc = new ads1x15(chip);
};

gesture.prototype.startReading = function(event){

    this.event = event

    if(!adc.busy){


        adc.startContinuousConversion(this.channel, this.pga, this.sps, function(err,data) {
            if(err)
            {
                //logging / troubleshooting code goes here...
                throw err;
            }
            delay = 1000 / this.sps;

            setInterval(readinglopp, delay)
            // if you made it here, then the data object contains your reading!

            // any other data processing code goes here...
        })
    }
}

var readinglopp = function(){
    adc.getLastConversionResults(this.pga,function(err,data){
        data /= 3200
        data = data<0 ? 0:data
        this.gestureArray.push([this.gestureArray.length,data])
        // console.log(data)
        if(this.gestureArray.length%20==0){
            var test_data = [[0,1],[1,2], [2,3], [3,4]]
            //var result = regression('linear',test_data);
            var result = regression('linear', this.gestureArray)
            //console.log("slope: " + result.equation[0]);
            //console.log("correlation: " + result.equation[2]);
            if(result.equation[0] > 0.0004 && result.equation[2] > 0.95) {
                this.event.emit("swipe_up");
                console.log("swipe up")
                console.log("slope: " + result.equation[0]);
                console.log("correlation: " + result.equation[2]);
            }else if(result.equation[0] < -0.0004 && result.equation[2] < -0.95){
                this.event.emit("swipe_down");
                console.log("swipe down")
                console.log("slope: " + result.equation[0]);
                console.log("correlation: " + result.equation[2]);
            }
            this.gestureArray.length = 0;
        }
    });
}
module.exports = gesture;
