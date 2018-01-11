import os, sys
import wx
import urllib2
import StringIO
import getgoogleresult
import event
class PhotoCtrl(wx.App):

    control = 0
    def __init__(self, redirect=False, filename=None):
        wx.App.__init__(self, redirect, filename)
        self.frame = wx.Frame(None, title='KUAR')
        self.panel = wx.Panel(self.frame)
        self.picPaths = []
        self.folderPath = "./lion/"
        self.files = os.listdir(self.folderPath)
        for file in self.files:
            print file
            self.picPaths.append(self.folderPath+file)
        self.totalPictures = 0
        self.currentPicture = 0
        self.panel.SetFocus()
        self.PhotoMaxSize = 320
        self.createWidgets()
        self.createEvents()
        self.loadImage(self.picPaths[self.currentPicture])
        self.frame.Show()

    def createEvents(self):
        self.panel.Bind(wx.EVT_KEY_DOWN, self.KeyDown)

    def createWidgets(self):
        img = wx.EmptyImage(240, 320)
        self.imageCtrl = wx.StaticBitmap(self.panel, wx.ID_ANY, wx.BitmapFromImage(img))
        self.result = wx.StaticText(self.panel, label="HELLO")

        self.mainSizer = wx.BoxSizer(wx.VERTICAL)
        self.sizer = wx.BoxSizer(wx.HORIZONTAL)

        self.mainSizer.Add(wx.StaticLine(self.panel, wx.ID_ANY),0, wx.ALL | wx.EXPAND, 5)
        self.mainSizer.Add(self.result, 0, wx.ALIGN_CENTER, 5)
        self.mainSizer.Add(self.imageCtrl, 0, wx.ALL, 5)
        self.mainSizer.Add(self.sizer, 0, wx.ALL, 5)

        self.panel.SetSizer(self.mainSizer)
        self.mainSizer.Fit(self.frame)

        self.panel.Layout()

    def loadImage(self, image):
        """
        Attempts to load the image and display it
        """
        image_name = os.path.basename(image)
        img = wx.Image(image, wx.BITMAP_TYPE_ANY)  
        # scale the image, preserving the aspect ratio
        W = img.GetWidth()
        H = img.GetHeight()
        if W > H:
            NewW = self.PhotoMaxSize
            NewH = self.PhotoMaxSize * H / W
        else:
            NewH = self.PhotoMaxSize
            NewW = self.PhotoMaxSize * W / H
        img = img.Scale(NewW, NewH)

        self.imageCtrl.SetBitmap(wx.BitmapFromImage(img))
        self.panel.Refresh()
        self.mainSizer.Fit(self.frame)

    #----------------------------------------------------------------------
    def nextPicture(self):
        """
        Loads the next picture in the directory
        """
        if self.currentPicture < 4 and self.currentPicture >= 0:
            self.currentPicture += 1
            self.loadImage(self.picPaths[self.currentPicture])
        else:
            self.currentPicture = 0
            print "You exceed matrix dimensions:"
        
    #----------------------------------------------------------------------
    def previousPicture(self):
        """
        Displays the previous picture in the directory
        """
        if self.currentPicture < 5 and self.currentPicture >= 1:
            self.currentPicture -= 1
            self.loadImage(self.picPaths[self.currentPicture])
        else:
            self.currentPicture = 0
            print "You exceed matrix dimensions:" 

    def call_back1(self, e):
        self.nextPicture()
    
    #----------------------------------------------------------------------
    def call_back2(self, e):
        self.previousPicture()

