# -*- coding: utf-8 -*-
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src import MicToSearch
from src import getgoogleresult
import time
obj = MicToSearch(morph_location="../morph/trmorph.fst",record_folder="../records/",debug=True)
obj.startrecording()
time.sleep(10)
results = obj.searchlastspeech()
if len(results)>0 : print results[0]['name']
else: print("No Results Found")
len(results)
obj.stoprecording()
