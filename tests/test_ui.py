# Example game using ptext module
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pygame
from src import ptext
ptext.FONT_NAME_TEMPLATE = "../fonts/%s.ttf"
pygame.init()

sx, sy = 240, 320
screen = pygame.display.set_mode((sx, sy), pygame.NOFRAME)

screen.fill((0, 30, 60))

ptext.draw("Allow me to demonstrate wrapped text.", bottom=25, right=200, width=240, lineheight=1.5, align="center")
pygame.display.flip()
while not any(event.type in (pygame.KEYDOWN, pygame.QUIT) for event in pygame.event.get()):
	pass
