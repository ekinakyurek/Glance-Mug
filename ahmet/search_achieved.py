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
#print(searchUrl)
#print(r)
#print result.get('items')

for item in result['items']:
#	print('{}:\n\t{}'.format(item['title'], item['link']))
	link = item['link']
print(link)

#file = cStringIO.StringIO(urllib.urlopen(link).read())
#img = Image.open(file)