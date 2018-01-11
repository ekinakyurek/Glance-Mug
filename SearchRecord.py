#coding=utf-8
import sys
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
import subprocess
import commands
reload(sys)
sys.setdefaultencoding('utf8')

def signal_handler(signal,frame):
    print 'You pressed Ctrl+C!'
    os.exit(0)

class SearchRecord:

    DISCOVERY_URL = ('https://{api}.googleapis.com/$discovery/rest?'
                 'version={apiVersion}')
    FLAC_CONV = 'flac -f'

    def __init__(self,
                 chunk=1024,
                 graph_enabled=False,
                 format=pyaudio.paInt16,
                 channels=1,
                 rate=48000,
                 record_seconds=9,
                 outputs=["output", "output1", "output2"]):

        self.framesTemp = []
        self.frames1 = []
        self.frames2 = []
        self.frames3 = []
        self.WAVE_OUTPUT_FILENAMES = outputs
        self.CHANNELS = channels
        self.RATE = rate
        self.CHUNK = chunk
        self.FORMAT = format
        self.RECORD_SECONDS = record_seconds
        self.GRAPH_ENABLED = graph_enabled
        self.p = pyaudio.PyAudio()

    def recordAudio(self):
        stream = self.p.open(format=self.FORMAT,
                             channels=self.CHANNELS,
                             rate=self.RATE,
                             input=True,
                             frames_per_buffer=self.CHUNK) #buffer

        print("* recording")

        while 1:
            data = stream.read(self.CHUNK, exception_on_overflow = False)

            self.framesTemp.append(data) # 2 bytes(16 bits) per channel

            if len(self.framesTemp) == int(self.RATE / self.CHUNK * self.RECORD_SECONDS):
                self.framesTemp.pop(0)

        """
        stream.stop_stream()
        stream.close()
        p.terminate()
        """

    def splitAudio(self):
        frames = self.framesTemp
        #print "frames len" + str(len(frames))
        self.frames1 = frames[0:(len(frames)/3)]
        self.frames2 = frames[(len(frames)/3):(len(frames)/3 * 2)]
        self.frames3 = frames[(len(frames)/3 * 2):len(frames)]
        #print("* done splitting")

    def saveAudio(self, fileName, aFrames):
        #print "saving frames len" + str(len(aFrames))
        wf = wave.open(fileName, 'wb')
        wf.setnchannels(self.CHANNELS)
        wf.setsampwidth(self.p.get_sample_size(self.FORMAT))
        wf.setframerate(self.RATE)
        wf.writeframes(b''.join(aFrames))
        wf.close()

        print "Converting to flac " + fileName
        os.system(SearchRecord.FLAC_CONV + ' ' + fileName + " > /dev/null 2>&1")
        fileName = fileName.split('.')[0] + '.flac'

    def get_speech_service(self):
        credentials = GoogleCredentials.get_application_default().create_scoped(
            ['https://www.googleapis.com/auth/cloud-platform'])
        http = httplib2.Http()
        credentials.authorize(http)
        return discovery.build(
            'speech', 'v1beta1', http=http, discoveryServiceUrl=SearchRecord.DISCOVERY_URL)

    def transcript(self, flac_cont, result):
        with open(flac_cont, 'rb') as speech:
            speech_content = base64.b64encode(speech.read())

        service = self.get_speech_service()
        service_request = service.speech().syncrecognize(
            body = {
                'config': {
                    'encoding': 'FLAC',  # raw 16-bit signed LE samples
                    'sampleRate': self.RATE,  # 16 khz
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

        #print flac_cont + " word list:"
        #print(result[0])
        #print "-----"

    def start(self):
        signal.signal(signal.SIGINT, signal_handler)
        try:
            tr = Thread(target=self.reader)
            tra = Thread(target=self.recordAudio)
        except:
           print "Error: unable to start thread"

        tr.start()
        tra.start()

        signal.pause()
        print(" -- end -- ")





    def reader(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_address = ('localhost', 10000)
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
                    data = connection.recv(10000)
                    print('received "%s"' % data)
                    if data == "Start":
                        print('sending data back to the client')
                        ret = self.messageHandler()
                        #ret = "bir iki 12 simit oluyor sdfds izliyorum filmlerinki fazlalar"
                        #ret = "  a"
                        #print "|" + ret + "|"
                        if (len(ret.strip()) > 0):
                            ret = discarder(ret.split(" "))
                        #print "Sending: " + ret
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


    def messageHandler(self):
        result1 = []
        result2 = []
        result3 = []
        totalResult = u''

        self.splitAudio()
        # TODO: Save wavs to tmpfs
        self.saveAudio(self.WAVE_OUTPUT_FILENAMES[0] + ".wav", self.frames1)
        self.saveAudio(self.WAVE_OUTPUT_FILENAMES[1] + ".wav", self.frames2)
        self.saveAudio(self.WAVE_OUTPUT_FILENAMES[2] + ".wav", self.frames3)

        try:
            t1 = Thread(target=self.transcript, args=("output.flac",  result1))
            t2 = Thread(target=self.transcript, args=("output1.flac", result2))
            t3 = Thread(target=self.transcript, args=("output2.flac", result3))

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
        #print(totalResult)

        return totalResult

    def foma_thread(self, word, index, totalW, totalR):
        ret = ""
        retR = ""

        #print word

        if (len(word.strip()) > 0):
            cmd = 'foma -e "load /home/pi/TRmorph/trmorph.fst" -e "up {0}" -e "quit"'.format(word)
            p = subprocess.Popen(cmd, shell=True, universal_newlines=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            asd = out.split("\n")

            #print out

            if (("<N>" in asd[1]) or ("<N:" in asd[1])):
                #print "yess.."
                a = asd[1]
                b = a[0:a.find("<")]

                if (GRAPH_ENABLED):
                    ret = word.decode('utf-8')
                retR = b.decode('utf-8')
                if (GRAPH_ENABLED):
                    retR = retR + ",Noun"
            elif ("???" in asd[1]):
                if (GRAPH_ENABLED):
                    ret = word.decode('utf-8')
                retR = word.decode('utf-8')
                if (GRAPH_ENABLED):
                    retR = retR + ",Noun"
            else:
                #print "noo"
                if (GRAPH_ENABLED):
                    a = asd[1]
                    b = a[0:a.find("<")]
                    ret = word.decode('utf-8')
                    retR = b.decode('utf-8')
                    retR = retR + ",Other"

        totalW[index] = ret
        totalR[index] = retR
        return ret


    def discarder(self, words):
        ret = ""
        threads = []
        totalR = [""] * len(words)
        totalW = [""] * len(words)

        for i in range(len(words)):
            word = words[i].encode('utf-8')
            t = Thread(target=self.foma_thread, args=(word, i, totalW, totalR))
            t.start()
            threads.append(t)

        for i in range(len(threads)):
            threads[i].join()

        for i in range(len(threads)):
            #print "|" + totalW[i] + "|"
            if (len(totalW[i]) == 0):
                continue
            if (len(ret) > 0):
                ret = ret + ' '
            ret = ret + totalW[i]

        for i in range(len(threads)):
            #print "|" + totalR[i] + "|"
            if (len(totalR[i]) == 0):
                continue
            if (len(ret) > 0):
                ret = ret + ' '
            ret = ret + totalR[i]

