##  READ 3 CHANNELS AND PRINT THE GESTURES ##

import time
import Adafruit_ADS1x15
from scipy import stats

adc = Adafruit_ADS1x15.ADS1015()
GAIN = 1

channel0 = []
channel1 = []
channel2 = []

# Read channel 0,1 and 2
print('Reading ADS1x15 channel 0,1 and 2...')
while (1):
    # Read the last ADC conversion value and print it out.
    for i in range(0,3):
        adc.start_adc(i, gain=GAIN)
        value = adc.get_last_result()
        #print "Channel %d: %d" %(i, value)
        if ((i == 0) and (value != 0)):
            channel0.append(value)
            if (len(channel0) == 4):
                x=list(range(4))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, channel0)
                channel0 = []
                if (slope < 0):
                    print "Channel 0: SWIPE DOWN"
                else:
                    print "Channel 0: SWIPE UP"
        if ((i == 1) and (value != 0)):
            channel1.append(value)
            if (len(channel1) == 4):
                x=list(range(4))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, channel1)
                channel1 = []
                if (slope < 0):
                    print "Channel 1: SWIPE DOWN"
                else:
                    print "Channel 1: SWIPE UP"
        if ((i == 2) and (value != 0)):
            channel2.append(value)
            if (len(channel2) == 4):
                x=list(range(4))
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, channel2)
                channel2 = []
                if (slope < 0):
                    print "Channel 2: SWIPE DOWN"
                else:
                    print "Channel 2: SWIPE UP"
    # Sleep
    time.sleep(0.2)

# Stop continuous conversion.  After this point you can't get data from get_last_result!
adc.stop_adc()
