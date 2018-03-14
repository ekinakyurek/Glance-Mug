# -*- coding: utf-8 -*-
import sys
reload(sys)
sys.setdefaultencoding("utf-8")
import pygame,os,sys,random,time,shutil,urllib2,StringIO
from pygame.locals import *
from scipy import stats

from threading import Thread

from src import MicToSearch
from src import getgoogleresult
from src import ptext
import subprocess
import signal
ptext.FONT_NAME_TEMPLATE = "fonts/%s.ttf"

SENSORS=False
if sys.platform == "darwin" or sys.platfrom.startswith("win"):
   print "Local Development"
else:
   import Adafruit_ADS1x15
   SENSORS=True

pygame.init()
clock = pygame.time.Clock()

SearchTerms=[]
description=[]
detailedDescription=[]
ID_dic={}
picPaths=[]
char_height=0

global image_old

class Mypanel():
   def __init__(self,parent,init=False):
     #global variable
      global SearchTerms
      global description
      global ID_dic
      global picPaths
      global image_old
      #class variable
      self.sx = 240;
      self.sy = 320;
      self.slideint = 10;
      self.imsize = (150,150);

      self.black = 0, 0, 0
      self.white = 255, 255, 255
      self.height=0

      self.f = "Verdana-Bold" #"Boogaloo"
      self.fontText=11
      self.fontSubTitle=11
      self.fontTitle=12
      self.hColor = (77,77,77)

      self.padX  = 8
      self.midX  = self.sx/2
      self.midY  = self.sy/2

      self.lineTitle=[]
      self.lineSubTitle=[]
      self.lineTitle2=[]
      self.lineSubTitle2=[]
      self.lineText=[]
      self.lineText2=[]
      self.screen = pygame.display.set_mode((self.sx,self.sy), pygame.NOFRAME)
      self.screen.fill(self.black)
      #get google results
      if not init:
          for i in range(len(SearchTerms)):
              picPaths.append([])
              folderPath="images/keyword"+str(i)+"/"
              getgoogleresult.createImageFolder(SearchTerms[i],i,imgfolder='images/keyword')
              image_wiki="images/keyword"+str(i)+"/temp0.bmp"
              self.wiki=pygame.Surface((self.sx,self.sy))
              self.wiki.fill(self.hColor,rect=pygame.Rect(0,0,self.sx,25))
              self.wiki.fill(self.black,rect=pygame.Rect(0,25,self.sx,215))
              ptext.draw(SearchTerms[i],midtop=(self.midX, self.padX),  width=self.sx-self.padX, surf=self.wiki, fontname=self.f, fontsize=self.fontTitle,    align="center")
              ptext.draw(description[i],midtop=(self.midX, 32), width=self.sx-self.padX, surf=self.wiki, fontname=self.f, fontsize=self.fontSubTitle, align="center")
              if i<len(detailedDescription):
                  ptext.draw(detailedDescription[i],(self.padX,80), width=self.sx-self.padX, surf=self.wiki, fontname=self.f, fontsize=self.fontText)
              pygame.image.save(self.wiki,image_wiki)
              self.files=os.listdir(folderPath)
              image_wiki=folderPath+"temp0.bmp"
              picPaths[i].append(image_wiki)
              print self.files
              for file in self.files:
                 print file
                 if file !="temp0.bmp":
                     picPaths[i].append(folderPath+file)
          print picPaths
          image_wiki="images/keyword"+str(0)+"/temp0.bmp"
          image = os.path.basename(image_wiki)
          image=pygame.image.load(image_wiki).convert()
          self.screen.blit(image,(0,0))
          image_old=image
          pygame.display.flip()
      else:
          self.informative_screen("Welcome","Waiting For Gesture Results")

   def informative_screen(self,title,text):
       self.screen.fill(self.hColor,rect=pygame.Rect(0,0,self.sx,25))
       self.screen.fill(self.black,rect=pygame.Rect(0,25,self.sx,215))
       ptext.draw(title,midtop=(self.midX, self.padX), width=self.sx-self.padX, surf=self.screen, fontname=self.f, fontsize=self.fontTitle,    align="center")
       ptext.draw(text,midtop=(self.midX, 32), width=self.sx-self.padX, surf=self.screen, fontname=self.f, fontsize=self.fontSubTitle, align="center")
       pygame.display.flip()



  #split the text to lines that fit into the screen
   def scale(self, image, size, maximum=True):
        w,h = image.get_size()
        x,y = size
        nw = y * w / h
        nh = x * h / w
        if maximum ^ (nw >= x):
                newsize =  nw or 1, y
                return pygame.transform.smoothscale(image,newsize)
        newsize =  x, nh or 1
        return pygame.transform.smoothscale(image,newsize)
   def HorizontalImage(self,image_nex,dir,next_id):
       global image_old
       key_index = int(image_nex.split('/')[1][-1])
       image_name = os.path.basename(image_nex)
       print "horizontal image: "+ image_name
       image = pygame.image.load(image_nex).convert()
       if next_id==0:
           image=self.scale(image,(self.sx,self.sy))
       else:
           image=self.scale(image,self.imsize)
       clock = pygame.time.Clock()
       box_y_1 = int((self.sy-image_old.get_size()[1])/2)
       box_y_2 = int((self.sy-image.get_size()[1])/2)
       if dir=="next":
          box_x_1 = int((self.sx-image_old.get_size()[0])/2)
          box_x_2 = self.sx+int((self.sx-image.get_size()[0])/2)
          box_dir = -self.slideint
       if dir=="previous":
          box_x_1 = int((self.sx-image_old.get_size()[0])/2)
          box_x_2 = -self.sx+int((self.sx-image.get_size()[0])/2)
          box_dir = self.slideint
       i=0
       while i<self.sx:
         clock.tick(50)
         for event in pygame.event.get():
            if event.type == pygame.QUIT:
               sys.exit()
         box_x_1 += box_dir
         box_x_2 += box_dir
         self.screen.fill(self.black)
         self.screen.blit(image_old,(box_x_1,box_y_1))
         self.screen.blit(image,(box_x_2,box_y_2))
         if next_id!=0:
             self.screen.fill(self.hColor,rect=pygame.Rect(0,0,self.sx,25))
             ptext.draw(SearchTerms[key_index],midtop=(self.midX, self.padX),width=self.sx-self.padX,fontname=self.f, fontsize=self.fontTitle,    align="center")
             ptext.draw(description[key_index],midtop=(self.midX, 32),width=self.sx-self.padX, fontname=self.f, fontsize=self.fontSubTitle, align="center")
         pygame.display.flip()
         i=i+self.slideint

       image_old=image

   def VerticalSwipe(self,nb_sub,image_nex,dir,old_index):
     	 #print text
     	 #initialize font
          global image_old
          global description
          global SearchTerms
          print "verticalswipe"
          image_name = os.path.basename(image_nex)
          image=pygame.image.load(image_nex).convert()
          clock = pygame.time.Clock()
          i=0
          box_x_1 = int((self.sx-image_old.get_size()[0])/2)
          box_x_2 = 0
          if dir=="up":
              box_y_1=int((self.sy-image_old.get_size()[1])/2)
              box_y_2=self.sy
              box_dir= -self.slideint
              print "up"
          if dir=="down":
              box_y_1=int((self.sy-image_old.get_size()[1])/2)
              box_y_2=-self.sy
              box_dir= self.slideint
              print "down"
     	  while i<self.sy:
             clock.tick(50)
             for event in pygame.event.get():
                if event.type == pygame.QUIT:
                   sys.exit()
             box_y_1+=box_dir
             box_y_2+=box_dir
             self.screen.fill(self.black)
             self.screen.blit(image_old,(box_x_1,box_y_1))
             self.screen.blit(image,(box_x_2,box_y_2))
     	     pygame.display.flip()
             i=i+self.slideint
          image_old=image

class MyFrame():
    def __init__(self,debug=False):

      self.first=0
      global SearchTerms
      self.sub_num=len(SearchTerms)
      self.sub_cur=0
      self.mictoSearch = MicToSearch(morph_location="morph/trmorph.fst", record_folder="records/",debug=debug)
      self.currentSubject=0
      self.currentPicture=0
      self.panel = Mypanel(self,True)

      self.mictoSearch.startrecording()
      self.running = True;
      signal.signal(signal.SIGINT, self.signal_handler)
      if SENSORS:
         t = Thread(target=self.Potentio)
         t.start()
      else:
         self.KeyboardControl()

    def signal_handler(self, signal, frame):
        print "signal is detected";
        self.mictoSearch.stoprecording()
        self.running = False;


    def nextPicture(self):
        global picPaths
        if len(picPaths) > self.currentSubject:
            if self.currentPicture < 5 and self.currentPicture >= 0:
                self.currentPicture += 1
                if len(picPaths[self.currentSubject]) > self.currentPicture:
                    self.panel.HorizontalImage(picPaths[self.currentSubject][self.currentPicture],"next",self.currentPicture)
                else:
                    print "No more picture to show"
            else:
                #self.currentPicture = 0
                print "No picture to show"
        else:
            print "There is no picture to show:"

    def previousPicture(self):
        """
        Displays the previous picture in the directory
        """
        global SearchTerms
        global picPaths
        if len(picPaths) > self.currentSubject:
            if self.currentPicture < 6 and self.currentPicture >= 1:
                self.currentPicture-=1
                if len(picPaths[self.currentSubject]) > self.currentPicture:
                    self.panel.HorizontalImage(picPaths[self.currentSubject][self.currentPicture],"previous",self.currentPicture)
                else:
                    print "No more picture to show"

            else:
                print "No picture to show"
        else:
            print "There is no picture to show:"
    def upScroll(self):

      global SearchTerms
      if self.currentSubject+1 < len(SearchTerms) and self.currentSubject+1 >= 0:
          self.currentSubject += 1
          old_pic = self.currentPicture
          self.currentPicture=0
          self.panel.VerticalSwipe(self.currentSubject,picPaths[self.currentSubject][0],"up", old_pic)
          print "I am going up"
      else:
          print "You exceed matrix dimensions:"

    def downScroll(self):
        global picPaths
        global SearchTerms

    	if self.currentSubject-1 >= 0:
            self.currentSubject-=1
            old_pic = self.currentPicture
            self.currentPicture=0
            self.panel.VerticalSwipe(self.currentSubject,picPaths[self.currentSubject][0],"down",old_pic)
            print "I Am down"
        else:
            print "You exceed matrix dimensions:"

    def processResults(self):
	global SearchTerms
        global description
        global picPaths
        global detailedDescription

        if len(self.results)>0:
         print self.results
         for i in range(len(self.results)):
            if self.results[i] != '':
               SearchTerms.append(self.results[i]['name'])
               #.encode('utf-8'))
               if 'description' in self.results[i]:
                  description.append(self.results[i]['description'])
               else:
                  description.append('No Description Available')
               if ('detailedDescription' in self.results[i]):
                  detailedDescription.append(self.results[i]['detailedDescription']['articleBody'])
             #.encode('utf-8'))
               self.panel=Mypanel(self)
    def quit(self):
       print "Quiting"


    def KeyboardControl(self):
        while self.running:
           for event in pygame.event.get():
              if event.type == pygame.QUIT:
                 running=False
              if event.type == pygame.KEYUP:
                 if event.key == pygame.K_SPACE:
                    print("Search Triggered");
                    self.panel.informative_screen("Searching...","Waiting for Results")
                    self.results=self.mictoSearch.searchlastspeech()
                    print self.results
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
                    self.processResults()
                 if event.key == pygame.K_DOWN: self.downScroll()
                 if event.key == pygame.K_LEFT: self.previousPicture()
                 if event.key == pygame.K_RIGHT: self.nextPicture()
                 if event.key == pygame.K_UP: self.upScroll()

        self.quit()



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
    subprocess.call(['./src/init.sh'])
    frame = MyFrame(debug=True)
    #app.MainLoop()
