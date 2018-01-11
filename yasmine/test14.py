import json
def func():
   data="yasmine"
   with open('data.json', 'w') as outfile:
    json.dump(data, outfile)
print func()
