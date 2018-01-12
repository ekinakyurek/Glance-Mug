import time
from MicandSearch.MicToSearch import *
obj = MicToSearch(morph_location="../morph/trmorph.fst",record_folder="../records/",debug=False)
obj.startrecording()
time.sleep(10)
results = obj.searchlastspeech()
if len(results)>0 : print results[0]['name']
else: print("No Results Found")
len(results)
obj.stoprecording()
