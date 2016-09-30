from PIL import ImageFont

#draw = ImageDraw.Draw(image)

#font = ImageFont.load("arial.pil")

draw.text((10, 25), "world", font=font)

font = ImageFont.("arial.pil")

draw.text((10, 25), "world", font=font)