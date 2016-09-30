'''
import webbrowser
webbrowser.open('/home/pi/bologna.jpg')
'''


from PIL import Image

image = Image.open("bologna.jpg")
image.show()
