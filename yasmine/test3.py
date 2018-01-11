# Simple demo of continuous ADC conversion mode for channel 0 of the ADS1x15 ADC.
# Author: Tony DiCola
# License: Public Domain
import time
#import matplotlib
#matplotlib.use('Agg')
#import matplotlib.pyplot as plt
# Import the ADS1x15 module.
import Adafruit_ADS1x15

from scipy import stats

# Create an ADS1115 ADC (16-bit) instance.
adc = Adafruit_ADS1x15.ADS1115()

# Or create an ADS1015 ADC (12-bit) instance.
#adc = Adafruit_ADS1x15.ADS1015()
GAIN=1
# Start continuous ADC conversions on channel 0 using the previously set gain
# value.  Note you can also pass an optional data_rate parameter, see the simpletest.py
# example and read_adc function for more infromation.
adc.start_adc(0, gain=GAIN)
# Once continuous ADC conversions are started you can call get_last_result() to
# retrieve the latest result, or stop_adc() to stop conversions.

# Note you can also call start_adc_difference() to take continuous differential
# readings.  See the read_adc_difference() function in differential.py for more
# information and parameter description.

# Read channel 0 for 5 seconds and print out its values.

i=0
print('Reading ADS1x15 channel 0 for 5 seconds...')
value_vector=[]
print("start")
value = adc.get_last_result()
start = time.time()
while (time.time() - start) <=2:
    # Read the last ADC conversion value and print it out.
	start2=time.time()
	j=0
	value_vector.append(value)
	#print('Channel 0:{0}'.format(value)) 
	value=adc.get_last_result()
	i=i+1
    # WARNING! If you try to read any other ADC channel during this continuous
    # conversion (like by calling read_adc again) it will disable the
    # continuous conversion!
    # Sleep for half a second.

# Stop continuous conversion.  After this point you can't get data from get_last_result!
adc.stop_adc()
x=list(range(i))
slope, intercept, r_value, p_value, std_err = stats.linregress(x, value_vector)
print("slope=",slope)
#fitLine=[]
#for j in x:
 #   fitLine.append( slope * x[j] + intercept)

#print(fitLine)
#plt.plot(x, fitLine, c='r')
#plt.show()
if(slope<0):
	print("SWIPE_LEFT")
else:
	print("SWIPE_RIGHT")
