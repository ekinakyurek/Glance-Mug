#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys
reload(sys)
sys.setdefaultencoding("utf-8")
import pygame,os,sys,random,time,shutil,urllib2,StringIO
from pygame.locals import *
from scipy import stats
from threading import Thread

from MicandSearch.MicToSearch import *
import getgoogleresult

SENSORS=False
if sys.platform == "darwin" or sys.platfrom.startswith("win"):
   print "Local Development"
else:
   import Adafruit_ADS1x15
   SENSORS=True

pygame.init()
SearchTerms=[]
description=[]
detailedDescription=[]
ID_dic={}
picPaths=[]
char_height=0

global image_old

class Mypanel():
   def __init__(self,parent):
     #global variable
      global SearchTerms
      global description
      global ID_dic
      global picPaths
      global image_old
      #class variable
      self.black = 0, 0, 0
      self.white = 255, 255, 255
      self.height=0
      self.lineTitle=[]
      self.lineSubTitle=[]
      self.lineTitle2=[]
      self.lineSubTitle2=[]
      self.lineText=[]
      self.lineText2=[]
      self.screen = pygame.display.set_mode((240,320))
      pygame.display.set_caption("Smart Mug")
      #fontName
      self.f = pygame.font.match_font(u'dejavuserif')
      #fontSize
      self.fontText=pygame.font.Font(self.f,16)
      self.fontSubTitle=pygame.font.Font(self.f,20)
      self.fontTitle=pygame.font.Font(self.f,25)
      self.screen.fill(self.black)
      char_width,char_height=self.fontText.size('a')
      print char_width
      char_width,char_height=self.fontTitle.size('a')
      print char_width
      #get google results
      for i in range(len(SearchTerms)):
        picPaths.append([])
      	folderPath="./folder"+str(i)+"/"
      	getgoogleresult.createImageFolder(SearchTerms[i],i)
        image_wiki="./folder"+str(i)+"/temp0.jpg"
        self.wiki=pygame.Surface((240,320))
        self.wiki.fill(self.black)
        self.lineTitle=self.splitText(0,0,SearchTerms[i],self.fontTitle)
        self.lineSubTitle=self.splitText(0,0,description[i],self.fontSubTitle)
        if i<(len(detailedDescription)):
             self.lineText=self.splitText(0,0,detailedDescription[i],self.fontText)
        self.height=0
        pygame.image.save(self.wiki,image_wiki)
        self.files=os.listdir(folderPath)
        image_wiki=folderPath+"temp0.jpg"
        picPaths[i].append(image_wiki)
        print self.files
        for file in self.files:
          print file
          if file !="temp0.jpg":
            picPaths[i].append(folderPath+file)
      print picPaths
      image_wiki="./folder"+str(0)+"/temp0.jpg"
      image = os.path.basename(image_wiki)
      image=pygame.image.load(image_wiki).convert()
      image=pygame.transform.scale(image,(240,320))
      self.screen.blit(image,(0,0))
      image_old=image
      pygame.display.flip()
  #split the text to lines that fit into the screen
   def splitText(self,x,y,text,myfont):
     if len(text)>0: #number of lines
        space=5
        print text

        num_line=0
        #line width
        line_width=0
        global char_height
        height = self.height + y
        line=[]
        if height<320:
         for i in range(len(text)):
          #get the width of the letter
          char_width,char_height=myfont.size(text[i])
          line_width = char_width+line_width
          #for the first letter
          if i==0:
            line.append(text[i])
          #if there is still spice in the line
          elif line_width<240:
           line[num_line]=line[num_line]+text[i]
           #go to the next line
          else:
           line_width=char_width
           #increment the line
           num_line=num_line+1
           line.append(text[i])
         #calculate the max lines that can be displayed
         test=True
         #if the number of lines is bigger then what the screen can handle cut the text and add three points
         print num_line
         for i in range(0,num_line+1):
          if test:
           print char_height
           print myfont
           if (self.height+char_height+space) >= 320:
             line[i]=list(line[i])
             line[i][len(line[i])-3:len(line[i])]=u'...'
             line[i]=u''.join(line[i])
             test=False
             print line[i]
           test=myfont.render(line[i],1,(255,255,255))
           self.wiki.blit(test,(x,(y+self.height)))
           self.height+=char_height+space
   #display the text in the screen

    #the transition between text and image


     	  #render text
   def HorizontalImage(self,image_nex,dir):
       global image_old

       print"horizontal image"
       image_name = os.path.basename(image_nex)
       image=pygame.image.load(image_nex).convert()
       image=pygame.transform.scale(image,(240,320))
       clock = pygame.time.Clock()
       if dir=="next":
        box_x_1 =240
        box_x_2=0
        box_dir =-9
       if dir=="previous":
          box_x_1 =-240
          box_x_2=0
          box_dir =9
       i=0
       while i<240:
         clock.tick(50)
         for event in pygame.event.get():
            if event.type == pygame.QUIT:
               sys.exit()
         box_x_1 += box_dir
         box_x_2+=box_dir
         self.screen.blit(image_old,(box_x_2,0))
         self.screen.blit(image,(box_x_1,0))
         pygame.display.flip()
         i=i+9
       image_old=image


   def VerticalSwipe(self,nb_sub,image_nex,dir):
     	 #print text
     	 #initialize font
          global image_old
          global description
          global SearchTerms
          print "verticalswipe"
          image_name = os.path.basename(image_nex)
          image=pygame.image.load(image_nex).convert()
          image=pygame.transform.scale(image,(240,320))
          clock = pygame.time.Clock()


          i=0
          if dir=="up":
              box_y_1=0
              box_y_2=320
              box_dir= -9
              print "up"
          if dir=="down":
              box_y_1=0
              box_y_2=-320
              box_dir=9
              print "down"
     	  while i<320:
             clock.tick(50)
             for event in pygame.event.get():
                if event.type == pygame.QUIT:
                   sys.exit()
             box_y_1 += box_dir
             box_y_2+=box_dir
           #self.screen.fill(self.black)
             self.screen.blit(image_old,(0,box_y_1))
             self.screen.blit(image,(0,box_y_2))
     	     pygame.display.flip()
             i=i+9
          image_old=image
class MyFrame():
    def __init__(self):
      self.first=0
      global SearchTerms

      self.sub_num=len(SearchTerms)
      self.sub_cur=0
      self.mictoSearch = MicToSearch()
      if SENSORS:
         t = Thread(target=self.Potentio)
      else:
         t = Thread(target=self.KeyboardControl)
      t.start()
      #self.mictoSearch.startrecording()
      self.currentSubject=0
      self.currentPicture=0
    def nextPicture(self):
        global picPaths
        if self.currentPicture < 5 and self.currentPicture >= 0:
            self.currentPicture += 1
            print picPaths
            self.panel.HorizontalImage(picPaths[self.currentSubject][self.currentPicture],"next")
        else:
            #self.currentPicture = 0
            print "You exceed matrix dimensions:"

    def previousPicture(self):
        """
        Displays the previous picture in the directory
        """
        global SearchTerms
        global picPaths

        if self.currentPicture < 6 and self.currentPicture >= 1:
            self.currentPicture-=1
            self.panel.HorizontalImage(picPaths[self.currentSubject][self.currentPicture],"previous")

        else:
            #self.currentPicture = 0
            print "You exceed matrix dimensions:"
    def upScroll(self):

      global SearchTerms
      if self.currentSubject < (len(SearchTerms)-1)and self.currentSubject >= 0:
          self.currentSubject += 1

          self.currentPicture=0
          self.panel.VerticalSwipe(self.currentSubject,picPaths[self.currentSubject][0],"up")
          print "I am going up"
      else:

            print "You exceed matrix dimensions:"

    def downScroll(self):
        global picPaths

    	global SearchTerms

    	if self.currentSubject < len(SearchTerms) and self.currentSubject >= 1:
            self.currentSubject-=1
            self.currentPicture=0
            self.panel.VerticalSwipe(self.currentSubject,picPaths[self.currentSubject][0],"down")
            print "I Am down"
        else:
            print "You exceed matrix dimensions:"


    def processResults(self):
	global SearchTerms
        global description
        global picPaths
        global detailedDescription

        if len(self.results)>0:
         for i in range(len(self.results)):
            SearchTerms.append(self.results[i]['name'])
            #.encode('utf-8'))
            description.append(self.results[i]['description'])
            if ('detailedDescription' in self.results[i]):
              detailedDescription.append(self.results[i]['detailedDescription']['articleBody'])
             #.encode('utf-8'))

         self.panel=Mypanel(self)
    def KeyboardControl(self):
        while True:
           self.results = [{"name":"ekin","description":"ekin akyurek"}]

    def Potentio(self):
        global picPaths
        """Run Worker Thread."""
        adc = Adafruit_ADS1x15.ADS1015()
        GAIN = 1
        channel0 = []
        channel1 = []
        channel2 = []

        # Read channel 0,1 and 2
        print('Reading ADS1x15 channel 0,1 and 2...')
        value_pre=[0,0,0]
        while (1):
            time.sleep(1.0)

            # Read the last ADC conversion value and print it out.
            for i in range(0, 3):
                adc.start_adc(i, gain=GAIN)
                value = adc.get_last_result()
                # print "Channel %d: %d" %(i, value)

                if ((i == 0) and (value != 0) and ((value - value_pre[0] > 20) or (value_pre[0] - value > 20))):
                    value_pre[0] = value
                    if (len(channel0) == 0):
                        start = time.time()
                    elif (len(channel0) < 3) and (len(channel0) > 0) and (time.time() - start) > 0.6:
                        channel0 = []
                        start = time.time()
                    elif (len(channel0) == 3):
                        x = list(range(3))
                        slope, intercept, r_value, p_value, std_err = stats.linregress(x, channel0)
                        channel0 = []
                        if slope>0:
                          print "next"
                          self.nextPicture()
                          slope=0
                        elif slope<0:
                                print "previous"
                        	self.previousPicture()
                                slope=0
                    channel0.append(value)
                if ((i == 2) and (value != 0) and ((value - value_pre[2] > 20) or (value_pre[2] - value > 20))):
                    value_pre[2] = value
                    if (len(channel1) == 0):
                        start = time.time()
                    elif (len(channel1) < 3) and (len(channel1) > 0) and (time.time() - start) > 0.6:
                        channel1 = []
                        start = time.time()
                    elif (len(channel1) == 3):
                        x = list(range(3))
                        slope1, intercept, r_value, p_value, std_err = stats.linregress(x, channel1)
                        channel1 = []
                        if slope1>0:
                                print"scroll up"
                        	self.upScroll()
                                slope1=0
                        elif slope1<0:
                                print "scroll down"
                        	self.downScroll()
                                slope1=0
                    channel1.append(value)
                if ((i == 1) and (value != 0) and ((value - value_pre[1] > 20) or (value_pre[1] - value > 20))):
                    value_pre[1] = value
                    if (len(channel2) == 0):
                        start = time.time()
                    if (len(channel2) < 3) and (len(channel2) > 0) and (time.time() - start) > 0.6:
                        channel2 = []
                        start = time.time()
                    channel2.append(value)
                    if (len(channel2) == 3):
                            x = list(range(3))
                            slope2, intercept, r_value, p_value, std_err = stats.linregress(x, channel2)
                            channel2 = []
                            self.results=self.mictoSearch.searchlastspeech()
                            if (len(self.results)>0):
                             if self.first!=0:
		                       for i in range(len(SearchTerms)):
		                            folder="./folder" + str(i) + "/"
                                            shutil.rmtree(folder)
                             else:
                                         self.first=1
                             description=[]
                             SearchTerms=[]
		             picPaths=[]
                             self.processResults()
                             slope2=0




            time.sleep(0.1)





if __name__ == '__main__':

    frame = MyFrame()
    #app.MainLoop()
