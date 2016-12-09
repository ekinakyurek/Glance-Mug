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
import pipes
from threading import Thread

from googleapiclient import discovery
from oauth2client.client import GoogleCredentials
import httplib2
import socket

import signal
import sys


DISCOVERY_URL = ('https://{api}.googleapis.com/$discovery/rest?'
                 'version={apiVersion}')

FLAC_CONV = 'flac -f'

CHUNK = 1024 
FORMAT = pyaudio.paInt16 #paInt8
CHANNELS = 1 
RATE = 48000

RECORD_SECONDS = 18

WAVE_OUTPUT_FILENAME = "output.wav"
WAVE_OUTPUT_FILENAME1 = "output1.wav"
WAVE_OUTPUT_FILENAME2 = "output2.wav"

framesTemp = []
frames1 = []
frames2 = []
frames3 = []


p = pyaudio.PyAudio()


def recordAudio():
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK) #buffer

    print("* recording")

    while(1):
        data = stream.read(CHUNK, exception_on_overflow = False)

        framesTemp.append(data) # 2 bytes(16 bits) per channel

        if(len(framesTemp) == int(RATE / CHUNK * RECORD_SECONDS)):
            framesTemp.pop(0)

    """
    stream.stop_stream()
    stream.close()
    p.terminate()
    """

def splitAudio():
    frames = framesTemp
    
    global frames1
    global frames2
    global frames3

    print "frames len" + str(len(frames))

    frames1 = frames[0:(len(frames)/3)]
    frames2 = frames[(len(frames)/3):(len(frames)/3 * 2)]
    frames3 = frames[(len(frames)/3 * 2):len(frames)]

    print("* done splitting")

def saveAudio(fileName, aFrames):
    print "saving frames len" + str(len(aFrames))

    wf = wave.open(fileName, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(aFrames))
    wf.close()

    print "Converting to flac " + fileName
    os.system(FLAC_CONV + ' ' + fileName + " > /dev/null 2>&1")
    fileName = fileName.split('.')[0] + '.flac'


def get_speech_service():
    credentials = GoogleCredentials.get_application_default().create_scoped(
        ['https://www.googleapis.com/auth/cloud-platform'])
    http = httplib2.Http()
    credentials.authorize(http)

    return discovery.build(
        'speech', 'v1beta1', http=http, discoveryServiceUrl=DISCOVERY_URL)

def transcript(flac_cont, result):
    with open(flac_cont, 'rb') as speech:
        speech_content = base64.b64encode(speech.read())

    service = get_speech_service()
    service_request = service.speech().syncrecognize(
        body = {
            'config': {
                'encoding': 'FLAC',  # raw 16-bit signed LE samples
                'sampleRate': RATE,  # 16 khz
                'languageCode': 'tr-TR',  # a BCP-47 language tag tr-TR
                'maxAlternatives': 0,
            },
            'audio': {
                'content': speech_content.decode('UTF-8')
                }
            })
            
    response = service_request.execute()
    sentence = json.dumps(response) 
    hop = json.loads(sentence)
    
    plainSentence = ""
    
    if (len(hop) > 0):
        plainSentence = hop["results"][0]["alternatives"][0]["transcript"]
    
    result.append(plainSentence)
    
    """
    sentence = sentence[73:-6]
    wordList = sentence.split(" ")
    
    for i in range(len(wordList)):
        result.append(wordList[i])
    """    
    
    print flac_cont + " word list:"
    print(result[0])
    print "-----"
        
def messageHandler():
    result1 = []
    result2 = []
    result3 = []
    totalResult = u''
       
    splitAudio()
    # TODO: Save wavs to tmpfs
    saveAudio("output.wav", frames1)
    saveAudio("output1.wav", frames2)
    saveAudio("output2.wav", frames3)

    try:
        t1 = Thread(target=transcript, args=("output.flac", result1))
        t2 = Thread(target=transcript, args=("output1.flac", result2))
        t3 = Thread(target=transcript, args=("output2.flac", result3))
        
        t1.start()
        t2.start()
        t3.start()
    except:
        print "Error: unable to start thread"

    t1.join()
    t2.join()
    t3.join()
    
    """    
    for i in range(len(result1)):
        if(len(result1[i]) > 0):
            totalResult += (" " + result1[i])

    for i in range(len(result2)):
        if(len(result2[i]) > 0):
            totalResult += (" " + result2[i])
        
    for i in range(len(result3)):
        if(len(result3[i]) > 0):
            totalResult += (" " + result3[i])
    """            
    
    print("resulting...")
    
    totalResult = u'' + result1[0] + u' ' + result2[0] + u' ' + result3[0]
    
    #print(unicode(totalResult, 'unicode-escape'))
    print(totalResult)
    
    return totalResult    
        
def reader():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 51381)
    
    print('starting up on %s port %s' % server_address)
    
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(server_address)
    sock.listen(1)

    while True:
        print('waiting for a connection')
        connection, client_address = sock.accept()
        try:
            print('connection from', client_address)
            while True:
                data = connection.recv(51381)
                print('received "%s"' % data)
                if (data == "Start"):
                    print('sending data back to the client')
                    
                    ret = messageHandler()
                    ascii_text = ret.encode('utf-8').strip()

                    if (len(ascii_text) == 0):
                        connection.sendall(" ")
                    else:
                        connection.sendall(ascii_text)
                else:
                    print('no more data from', client_address)
                    break
                    
        except Exception,e:
            print "Couldn't do it: %s" % e
            
        finally:
            connection.shutdown(2)
            connection.close()

def signal_handler(signal, frame):
    print 'You pressed Ctrl+C!'

    os._exit(0)

def main():
    signal.signal(signal.SIGINT, signal_handler)

    try:
        tr = Thread(target=reader)
        tra = Thread(target=recordAudio)

    except:
       print "Error: unable to start thread"
    
    tr.start()
    tra.start()

    signal.pause()
    #tr.join()

    print(" -- end -- ")

if __name__ == '__main__':
    main()
