echo "========================Welcome the DesignLab Raspi============================="
echo "=======Printing IP============"
ifconfig | perl -nle 's/dr:(\S+)/print $1/e'
echo "=======Printing USB Devices============"
lsusb
cd ~/ADC/node_adc_reading/
echo "=======Waiting for swipe gestures========= "
echo "You can stop it with ctrl+c"
#node multichannel_reading.js
