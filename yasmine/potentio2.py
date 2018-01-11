import time
import Adafruit_ADS1x15

from scipy import stats
# Create an ADS1115 ADC (16-bit) instance.
adc = Adafruit_ADS1x15.ADS1115()

GAIN=1
adc.start_adc(1, gain=GAIN)
print('Reading ADS1x15 channel 0 for 5 seconds...')
print("start")
while 1:
	i=0
	value_vector=[]
	start = time.time()
	while (i <=2:
    # Read the last ADC conversion value and print it out.
        	value=adc.get_last_result()
		value_vector.append(value)
		i=i+1

# Stop continuous conversion.  After this point you can't get data from get_last_result!
	x=list(range(i))
	slope, intercept, r_value, p_value, std_err = stats.linregress(x, value_vector)
	print("slope=",slope)

	if(slope<0):
        	print("SWIPE_LEFT")
	else:
        	print("SWIPE_RIGHT")
	time.sleep(0.2)
adc.stop_adc()

                                                            
