import requests
import json
#import urllib, cStringIO

searchTerm = 'parrot'
startIndex = '1'
key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE'
cx = '007548910499588559159:lepkrgs8oig'
count = '1'
searchUrl = "https://www.googleapis.com/customsearch/v1?q=" + \
    searchTerm + "&num=" + count + "&start=" + startIndex + "&key=" + key + "&cx=" + cx + \
    "&searchType=image"
r = requests.get(searchUrl)
response = r.content.decode('utf-8')
result = json.loads(response)
print(searchUrl)
print(r)
print result.get('items')

for item in result['items']:
	print('{}:\n\t{}'.format(item['title'], item['link']))

#print("The following Python keys have been defined:")
#for outer_key in result:
#    print("- %s" % outer_key)
    
# Allow the user to choose a word, and then display the meaning for that word.
requested_outer_key = "items"
#print("\n%s: %s" % (requested_outer_key, result[requested_outer_key]))
#path_to_inner_key = result[requested_outer_key]

#print("The following Python values have been defined:")
#for inner_key in path_to_inner_key:
#    print(inner_key)

#file = cStringIO.StringIO(urllib.urlopen(URL).read())
#img = Image.open(file)