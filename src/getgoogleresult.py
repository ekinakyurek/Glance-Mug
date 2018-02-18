import os, sys
import urllib2, json, StringIO, imghdr

count = 10
startIndex = '1'
idCount = 0
key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE'
cx = '007548910499588559159:lepkrgs8oig'
api_host = 'kgsearch.googleapis.com'

def createImageFolder(searchTerm,ID,imgfolder='images/keyword'):
    global count
    searchTerm= searchTerm.replace(" ","+")
    path = imgfolder + str(ID)
    if not os.path.exists(path):
        os.makedirs(path)
        i=1
        URL = "https://www.googleapis.com/customsearch/v1?q=" + searchTerm + "&num=" + str(count) + "&start=" + startIndex + "&key="+ key + "&cx=" + cx + "&searchType=image"
        try:
            url= urllib2.urlopen(URL)
        except urllib2.URLError as e:
            print "Website (%s) could not be reached due to %s" % (e.url, e.reason)
        searchResult= json.load(url)
        j=0
        while i<6 and j<count:
            IMG_URL = searchResult["items"][j]["link"]
            j=j+1
            print IMG_URL

            try:
                img_url= urllib2.urlopen(IMG_URL)
                print img_url
            except urllib2.URLError:
                print "URL Error for the link",IMG_URL

            try:
                f = open(path+'/temp'+str(i)+'.jpg', 'wb')

                f.write(img_url.read())

                a=imghdr.what(path+'/temp'+str(i)+'.jpg')
                print a
                if  a!="jpeg" and  a!="png" and  a!="jpg":
                     os.remove((path+'/temp'+str(i)+'.jpg'))
                else:
                     i=i+1

            except IOError as e:
                print "I/O error({0}): {1}".format(e.errno, e.strerror)
            except ValueError:
                print "Could not convert data to an integer."
            except:
                print "Unexpected error:", sys.exc_info()[0]

    else:
        print "Directory already exists"


if __name__ == '__main__':
    createImageFolder('sloth',1)
