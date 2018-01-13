import pygame

pygame.init()
screen = pygame.display.set_mode((240, 320), pygame.NOFRAME)
running = True
is_blue = True
x = 30
y = 30

while running:
        for event in pygame.event.get():
                if event.type == pygame.QUIT:
                        running = False
                if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_SPACE:
                                is_blue = not is_blue
                        if event.key == pygame.K_UP: y -= 3
                        if event.key == pygame.K_DOWN: y += 3
                        if event.key == pygame.K_LEFT: x -= 3
                        if event.key == pygame.K_RIGHT: x += 3

        if is_blue: color = (0, 128, 255)
        else: color = (255, 100, 0)
        pygame.draw.rect(screen, color, pygame.Rect(x, y, 30, 30))

        pygame.display.flip()
