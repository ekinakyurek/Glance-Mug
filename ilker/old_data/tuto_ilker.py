"""Google Cloud Speech API sample application using the REST API for batch
processing."""

import pyaudio
import wave
import argparse
import base64
import json
import os
import io
import thread

from googleapiclient import discovery
import httplib2
from oauth2client.client import GoogleCredentials

DISCOVERY_URL = ('https://{api}.googleapis.com/$discovery/rest?'
                 'version={apiVersion}')

FLAC_CONV = 'flac -f'  # We need a WAV to FLAC converter. flac is available
                       # on Linux

keypress = raw_input("Press a key to start recording: ")

CHUNK = 1024 
FORMAT = pyaudio.paInt16 #paInt8
CHANNELS = 1 
RATE = 48000 #sample rate
RECORD_SECONDS = 12
WAVE_OUTPUT_FILENAME = "output.wav"
WAVE_OUTPUT_FILENAME1 = "output1.wav"
WAVE_OUTPUT_FILENAME2 = "output2.wav"

p = pyaudio.PyAudio()

stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK) #buffer

print("* recording")

frames = []
frames2 = []
frames3 = []

for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
    data = stream.read(CHUNK, exception_on_overflow = False)
    
    if (i < int(RATE / CHUNK * 4)):
        frames.append(data) # 2 bytes(16 bits) per channel
    elif (i > int(RATE / CHUNK * 4)) and i < int(RATE / CHUNK * 8):
		frames2.append(data) # 2 bytes(16 bits) per channel
    else:
		frames3.append(data) # 2 bytes(16 bits) per channel


print("* done recording")

stream.stop_stream()
stream.close()
p.terminate()

wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()

wf = wave.open(WAVE_OUTPUT_FILENAME1, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames2))
wf.close()

wf = wave.open(WAVE_OUTPUT_FILENAME2, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames3))
wf.close()

print "Sending ", WAVE_OUTPUT_FILENAME

#Convert to flac first
filename = WAVE_OUTPUT_FILENAME
del_flac = False
if 'flac' not in filename:
    del_flac = True
    print "Converting to flac"
    print FLAC_CONV + filename
    os.system(FLAC_CONV + ' ' + filename)
    filename = filename.split('.')[0] + '.flac'
    
filename = WAVE_OUTPUT_FILENAME1
del_flac = False
if 'flac' not in filename:
    del_flac = True
    print "Converting to flac"
    print FLAC_CONV + filename
    os.system(FLAC_CONV + ' ' + filename)
    filename = filename.split('.')[0] + '.flac'
    
filename = WAVE_OUTPUT_FILENAME2
del_flac = False
if 'flac' not in filename:
    del_flac = True
    print "Converting to flac"
    print FLAC_CONV + filename
    os.system(FLAC_CONV + ' ' + filename)
    filename = filename.split('.')[0] + '.flac'

flac_cont = filename

def get_speech_service():
    credentials = GoogleCredentials.get_application_default().create_scoped(
        ['https://www.googleapis.com/auth/cloud-platform'])
    http = httplib2.Http()
    credentials.authorize(http)

    return discovery.build(
        'speech', 'v1beta1', http=http, discoveryServiceUrl=DISCOVERY_URL)

def hop(flac_cont, asd):
    """Transcribe the given audio file.

    Args:
        speech_file: the name of the audio file.
    """
    
    print "11111"
    with open(flac_cont, 'rb') as speech:
        speech_content = base64.b64encode(speech.read())

    service = get_speech_service()
    service_request = service.speech().syncrecognize(
        body={
            'config': {
                'encoding': 'FLAC',  # raw 16-bit signed LE samples
                'sampleRate': 48000,  # 16 khz
                'languageCode': 'tr-TR',  # a BCP-47 language tag tr-TR
            },
            'audio': {
                'content': speech_content.decode('UTF-8')
                }
            })
    response = service_request.execute()
    sentence = json.dumps(response)
    print "222"
    print response
    
    print "-----"
    
    print sentence
    
    print "-----"
    
    with open('test.txt','wb') as f:
    	f.write((sentence[73:-6]).encode("ISO-8859-9"))
    f.close()
    with open('test.txt','r+') as f:
    	sentence_in_file = f.read()
    word_list = sentence_in_file.split(" ")
    print(word_list)


def main(flac_cont):
    #hop(flac_cont)
    try:
       #thread.start_new_thread( hop, (flac_cont, "asd", ) )
       thread.start_new_thread( hop, ("output.flac", "asd", ) )
       thread.start_new_thread( hop, ("output1.flac", "asd", ) )
       thread.start_new_thread( hop, ("output2.flac", "asd", ) )

    except:
       print "Error: unable to start thread"
       
    while 1:
       pass


if __name__ == '__main__':
    main(flac_cont)
