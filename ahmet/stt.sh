echo "Recording your Speech (Ctrl+C to Transcribe)"
arecord -D plughw:1 -q -f cd -t wav -d 5 -r 16000 | flac - -f --best --sample-rate 16000 -s -o daveconroy.flac;
 
echo "Converting Speech to Text..."
wget -q -U --post-file daveconroy.flac --header="Content-Type: audio/x-flac; rate=16000" -O - "https://speech.googleapis.com/v1beta1/operations/syncRecognize?client=chromium&lang=en_us&key=AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE" | cut -d\" -f12  > stt.txt 

echo "You Said:"
value=`cat stt.txt`
echo "$value"
