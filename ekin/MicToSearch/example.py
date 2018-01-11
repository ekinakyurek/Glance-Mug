import time
from MicToSearch import *
obj = MicToSearch()
obj.startrecording()
time.sleep(10)
results = obj.searchlastspeech()
print results
obj.stoprecording()
