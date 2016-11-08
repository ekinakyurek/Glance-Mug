import pyaudio
import wave
import argparse
import base64
import json
import os
import io
import thread

    
    
def main():
    
    with open('test.txt','r+') as f:
    	sentence_in_file = f.read()
        
    #word_list = sentence_in_file.split(" ")
    print(sentence_in_file.encode('iso-8859-1'))
    print 'gr\xc3\xa9gory'.decode('utf8')

if __name__ == '__main__':
    
    main()
