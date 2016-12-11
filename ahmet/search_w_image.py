import requests
import json

from PIL import Image

import pygame
from pygame.locals import *

import urllib, cStringIO

#320x240 display surface starts
pygame.init()
screen = pygame.display.set_mode((320,240),0,32)

#Related to search
searchTerm = 'parrot'
startIndex = '1'
key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE'
cx = '007548910499588559159:lepkrgs8oig'
count = '10'
ftype = 'jpg'
searchUrl = "https://www.googleapis.com/customsearch/v1?q=" + \
    searchTerm + "&num=" + count + "&start=" + startIndex + "&key=" + key + "&cx=" + cx + \
    "&searchType=image" + "&fileType=" + ftype
r = requests.get(searchUrl)
response = r.content.decode('utf-8')
result = json.loads(response)
print(searchUrl)
print(r)
print result.get('items')
print(result)

#Provides the link to the image search and assigns it to a variable called link 
for item in result['items']:
#	print('{}:\n\t{}'.format(item['title'], item['link']))
	link = item['link']
print(link)

#Retrieves the image file from the variable link and save it as an image file
urllib.urlretrieve(link, "Search_Images//02.jpg")

#Loads the saved image file
background = pygame.image.load("Search_Images/02.jpg")

while True:
	screen.blit(background, (0,0))
	pygame.display.update()