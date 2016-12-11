import pygame
from pygame.locals import *

pygame.init()

screen = pygame.display.set_mode((320,240),0,32)

background = pygame.image.load("bologna.jpg").convert()

while True:
	screen.blit(background, (0,0))
	pygame.display.update()