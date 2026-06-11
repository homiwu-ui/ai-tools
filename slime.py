from PIL import Image, ImageDraw
import math

w, h = 400, 400
img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx, cy = 200, 200

# shadow
draw.ellipse([cx-80, cy+50, cx+80, cy+75], fill=(0,0,0,30))

# body - blob shape using ellipse and waves
body_color = (74, 158, 255, 255)
dark_color = (42, 122, 216, 255)
light_color = (126, 207, 255, 255)

# main body rounded rect path
points = []
for a in range(0, 361):
    rad = math.radians(a)
    # squish top, wide bottom
    rx = 90 + 10 * math.sin(rad * 2) * 0.3
    ry = 80 + 15 * math.sin(rad) * 0.2
    if 60 < a < 120: ry -= 10  # flatten top
    if 240 < a < 300: rx += 5  # widen middle
    x = cx + rx * math.cos(rad)
    y = cy + ry * math.sin(rad) * 0.85
    points.append((x, y))

draw.polygon(points, fill=body_color, outline=dark_color)

# wavy bottom overlay
wave = []
for a in range(180, 361):
    rad = math.radians(a)
    rx = 90 + 10 * math.sin(rad * 2) * 0.3
    ry = 80 + 15 * math.sin(rad) * 0.2
    if 240 < a < 300: rx += 5
    x = cx + rx * math.cos(rad)
    y = cy + ry * math.sin(rad) * 0.85
    wave.append((x, y))

for i in range(6):
    t = i / 5
    px = cx - 75 + t * 150
    py = cy + 58 + 8 * math.sin(t * math.pi * 3)
    wave.append((px, py))

# eyes
eye_y = cy - 15
# left eye
draw.ellipse([cx-22, eye_y-11, cx-4, eye_y+11], fill=(255,255,255))
draw.ellipse([cx-18, eye_y-6, cx-8, eye_y+4], fill=(26,26,46))
draw.ellipse([cx-15, eye_y-8, cx-12, eye_y-5], fill=(255,255,255))
# right eye
draw.ellipse([cx+4, eye_y-11, cx+22, eye_y+11], fill=(255,255,255))
draw.ellipse([cx+8, eye_y-6, cx+18, eye_y+4], fill=(26,26,46))
draw.ellipse([cx+12, eye_y-8, cx+15, eye_y-5], fill=(255,255,255))

# blush
draw.ellipse([cx-42, cy+8, cx-28, cy+16], fill=(255,138,160,80))
draw.ellipse([cx+28, cy+8, cx+42, cy+16], fill=(255,138,160,80))

# highlight
draw.ellipse([cx-20, cy-48, cx+10, cy-28], fill=(184,228,255,100))

# droplets
draw.ellipse([cx-5, cy-68, cx+3, cy-60], fill=(126,207,255,180))
draw.ellipse([cx+6, cy-72, cx+12, cy-66], fill=(126,207,255,120))

img.save("G:\\我的雲端硬碟\\AI小工具\\slime.png")
print("slime.png saved")
