# -*- coding: utf-8 -*-
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


class MicToText:

    DISCOVERY_URL = ('https://{api}.googleapis.com/$discovery/rest?'
                 'version={apiVersion}')
    FLAC_CONV = 'flac -f'

    def __init__(self,
                 chunk=1024,
                 graph_enabled=True,
                 format=pyaudio.paInt16,
                 channels=1,
                 rate=48000,
                 record_seconds=9,
                 partition=3,
                 morph_location="../morph/trmorph.fst",
                 key_location= "../keys/google.json",
                 record_folder="../records/",
                 debug=False):
        self.debug=debug
        self.framesTemp = []
        self.frames = []
        self.partition = partition
        self.WAVE_OUTPUT_FILENAMES = []
        self.RECORDFOLDER = record_folder
        for i in range(0, partition):
            self.WAVE_OUTPUT_FILENAMES.append(self.RECORDFOLDER+"output"+str(i)+".wav")
        self.CHANNELS = channels
        self.RATE = rate
        self.CHUNK = chunk
        self.FORMAT = format
        self.RECORD_SECONDS = record_seconds
        self.GRAPH_ENABLED = graph_enabled
        self.p = pyaudio.PyAudio()
        self.recordThread = None
        self.running = True
        self.MORPH=morph_location
        self.KEYLOCATION=key_location

    def signal_handler(self, signal, frame):
        print "signal is detected"
        self.stop()

    def recordAudio(self):
        stream = self.p.open(format=self.FORMAT,
                             channels=self.CHANNELS,
                             rate=self.RATE,
                             input=True,
                             frames_per_buffer=self.CHUNK) #buffer

        print("* recording *")

        while self.running:
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
        totalframe = self.framesTemp
        #print "frames len" + str(len(frames))
        for i in range(0, self.partition):
            self.frames.append(totalframe[len(totalframe)/self.partition*i: len(totalframe)/self.partition*(i+1)-1])
        #print("* done splitting")

    def saveAudio(self, fileName, aFrames):
        #print "saving frames len" + str(len(aFrames))
        wf = wave.open(fileName, 'wb')
        wf.setnchannels(self.CHANNELS)
        wf.setsampwidth(self.p.get_sample_size(self.FORMAT))
        wf.setframerate(self.RATE)
        wf.writeframes(b''.join(aFrames))
        wf.close()

        if self.debug: print "Converting to flac " + fileName
        os.system(MicToText.FLAC_CONV + ' ' + fileName + " > /dev/null 2>&1")
        fileName = fileName.split('.')[0] + '.flac'

    def get_speech_service(self):
        credentials = GoogleCredentials.get_application_default().create_scoped(
            ['https://www.googleapis.com/auth/cloud-platform'])
        http = httplib2.Http()
        credentials.authorize(http)
        return discovery.build(
            'speech', 'v1beta1', http=http, discoveryServiceUrl=MicToText.DISCOVERY_URL)

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
        if self.debug: print response
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
        signal.signal(signal.SIGINT, self.signal_handler)
        try:
            self.recordThread = Thread(target=self.recordAudio)
            self.recordThread.start()
            if self.debug: print(" -- started -- ");
        except:
           print "Error: unable to start thread"
        #signal.pause()

    def stop(self):
        self.running = False
        self.recordThread.join()
        if self.debug: print(" -- stopped -- ")


    def reader(self):

        ret = self.messageHandler()

        #ret = "bir iki 12 simit oluyor sdfds izliyorum filmlerinki fazlalar"
        #ret = "  a"
        #print "|" + ret + "|"
        if (len(ret.strip()) > 0):
            ret = ret
            if self.debug: print ret
            ret = self.discarder(ret.split(" "))
       # print "Sending: " + ret
        ascii_text = ret
        if (len(ascii_text) == 0):
            return " "
        else:
            return ascii_text


    def messageHandler(self):
        results = []
        threads = []
        totalResult = u''

        self.splitAudio()
        # TODO: Save wavs to tmpfs
        for i in range(0,self. partition):
            self.saveAudio(self.WAVE_OUTPUT_FILENAMES[i], self.frames[i])

        try:
            for i in range(0,self.partition):
                results.append([])
                threads.append(Thread(target=self.transcript, args=(self.RECORDFOLDER+"output"+str(i)+".flac",  results[i])))
                threads[i].start()
        except:
            print "Error: unable to start thread"

        for i in range(0, self.partition):
            threads[i].join()


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

        if self.debug: print("resulting...")
        for i in range(0, self.partition):
            if i != self.partition-1 :
                totalResult += results[i][0] + u' '
            else:
                totalResult += results[i][0]
        self.frames = []
        self.threads = []
        #print(unicode(totalResult, 'unicode-escape'))
        #print(totalResult)

        return totalResult

    def foma_thread(self, word, index, totalW, totalR):

        ret = ""
        retR = ""

        #print word

        if (len(word.strip()) > 0):
            cmd = 'foma -e "load '+self.MORPH+'" -e "up {0}" -e "quit"'.format(word)
            p = subprocess.Popen(cmd, shell=True, universal_newlines=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            asd = out.split("\n")
            if self.debug: print out

            if (("<N>" in asd[1]) or ("<N:" in asd[1])):
                #print "yess.."
                a = asd[1]
                b = a[0:a.find("<")]

                if (self.GRAPH_ENABLED):
                    ret = word.decode('utf-8')
                retR = b.decode('utf-8')
                if (self.GRAPH_ENABLED):
                    retR = retR + ",Noun"
            elif ("???" in asd[1]):
                if (self.GRAPH_ENABLED):
                    ret = word.decode('utf-8')
                retR = word.decode('utf-8')
                if (self.GRAPH_ENABLED):
                    retR = retR + ",Noun"
            else:
                #print "noo"
                if (self.GRAPH_ENABLED):
                    a = asd[1]
                    b = a[0:a.find("<")]
                    ret = word.decode('utf-8')
                    retR = b.decode('utf-8')
                    retR = retR + ",Other"

        totalW[index] = ret
        totalR[index] = retR


    def discarder(self, words):
        if self.debug: print words
        ret = ""
        threads = []
        totalR = [""] * len(words)
        totalW = [""] * len(words)

        for i in range(len(words)):
            word = words[i].encode('utf-8')
            t = Thread(target=self.foma_thread, args=(word, i, totalW, totalR))
            threads.append(t)
            threads[i].start()

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
        return ret
