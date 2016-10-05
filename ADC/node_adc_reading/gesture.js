var ads1x15 = require('node-ads1x15');
var regression = require('./regression')

function gesture(chip, channel, pga, sps) {

        this.chip = chip
        this.channel = channel
        this.pga = pga
        this.sps = sps
        this.gestureArray = [];
        this.adc = new ads1x15(chip);
};

gesture.prototype.startReading = function(event){

    this.event = event
    self = this
    

    if(!this.adc.busy){
	

        this.adc.startContinuousConversion(this.channel, this.pga, this.sps, function(err,data) {
            if(err)
            {
                //logging / troubleshooting code goes here...
                throw err;
            }
            delay = 1000 / self.sps;
	    //console.log(delay)
            //

	    setInterval(self.readinglopp.bind(self), delay)
            // if you made it here, then the data object contains your reading!

            // any other data processing code goes here...
        })
    }
}
gesture.prototype.readinglopp = function(){
    self = this
    self.adc.getLastConversionResults(self.pga,function(err,data){
	data /= 3200
	data = data<0 ? 0:data
	self.gestureArray.push([self.gestureArray.length,data])
	// console.log(data)
	if(self.gestureArray.length%20==0){
	    var test_data = [[0,1],[1,2], [2,3], [3,4]]
	    //var result = regression('linear',test_data);
	    var result = regression('linear', self.gestureArray)
	    //console.log("slope: " + result.equation[0]);
	    //console.log("correlation: " + result.equation[2]);
	    if(result.equation[0] < 0.0004 && result.equation[0] > -0.0004 && (result.equation[2] > 0.95 || result.equation[2] <-0.90)){
		self.event.emit("point-detection")
	    }
	    else if(result.equation[0] > 0.0004 && result.equation[2] > 0.95) {
		self.event.emit("swipe-up");
		//console.log("swipe up")
		//console.log("slope: " + result.equation[0]);
		//console.log("correlation: " + result.equation[2]);
	    }else if(result.equation[0] < -0.0004 && result.equation[2] < -0.95){
		self.event.emit("swipe-down");
		//console.log("swipe down")
		//console.log("slope: " + result.equation[0]);
		//console.log("correlation: " + result.equation[2]);
	    }
	    self.gestureArray.length = 0;
	}
    });
}

module.exports = gesture;
