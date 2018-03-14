import os, sys
import urllib
import urllib2, json, StringIO, imghdr


count = 10
startIndex = '1'
idCount = 0
key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE'
cx = '007548910499588559159:lepkrgs8oig'
api_host = 'kgsearch.googleapis.com'
imgSize = 'medium'

def createImageFolder(searchTerm,ID,imgfolder='images/keyword'):
    searchTerm = searchTerm.replace(" ","+")
    path = imgfolder + str(ID)
    if not os.path.exists(path):
        os.makedirs(path)
        URL = "https://www.googleapis.com/customsearch/v1?q=" + searchTerm + "&num=" + str(count) + "&start=" + startIndex + "&key="+ key + "&cx=" + cx + "&searchType=image" + "&imgSize="+imgSize
        try:
            url= urllib2.urlopen(URL)
            searchResult= json.load(url)
            j=0;i=1;
            while i<6 and j<count:
                IMG_URL = searchResult["items"][j]["link"]
                j=j+1
                try:
                    img_type = IMG_URL.split('.')[-1].lower()
                    print IMG_URL
                    if img_type in ["jpeg","png","jpg","bmp"]:
                        try:
                            location = path+'/temp'+str(i)+'.'+img_type
                            f = open(location, 'wb')
                            img_url  = urllib2.urlopen(IMG_URL)
                            f.write(img_url.read()); f.close();
                            if os.path.getsize(location) > 0:
                                i=i+1;
                            else:
                                os.remove(location);
                        except IOError as e:
                            print "I/O error({0}): {1}".format(e.errno, e.strerror)
                        except ValueError as e:
                            print "Could not convert data to an integer.: " + e.strerror
                        except TypeError as e:
                            print "Unexpected error: ", e
                except urllib2.URLError:
                    print "URL Error for the link",IMG_URL

        except urllib2.URLError as e:
            print "Website (%s) could not be reached due to %s" % (e.url, e.reason)

    else:
        print "Directory already exists"


if __name__ == '__main__':
    createImageFolder('sloth',1)
