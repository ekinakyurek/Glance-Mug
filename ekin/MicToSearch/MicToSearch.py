# -*- coding: utf-8 -*-
import time
from WebSearch import *
from MicToText import *

class MicToSearch:
    def __init__(self):
        self.mictotext = MicToText()
        self.websearch = WebSearch()
    def startrecording(self):
        self.mictotext.start()
    def stoprecording(self):
        self.mictotext.stop()
    def searchlastspeech(self):
        text = self.mictotext.reader()
        return self.websearch.starter(text,False,None,None)
    
#
# a =  web_search.WebSearch()
# test_input = "ekin konulsa da güneş balçıkla ekin yasak,Noun konul,Noun da,Other güneş,Noun balçık,Noun ekin,Noun";
# a.starter(test_input, True, None, None)
