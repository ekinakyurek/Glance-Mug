#!/bin/bash

c=1

while :
do
	echo "$c:"
	if [ "$c" -lt "10" ] 
	then
		sox out-0$c.wav -n stats 2>&1 | grep 'RMS lev dB\|RMS Pk dB' | awk '{print $4}'
	else
		sox out-$c.wav -n stats 2>&1 | grep 'RMS lev dB\|RMS Pk dB' | awk '{print $4}'
	fi
		
	((c++))
	echo " "
done
