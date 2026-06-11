from PIL import Image, ImageDraw
import math

w, h = 500, 500
img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx, cy = 250, 260

# colors
orange   = (255, 140, 50, 255)
dkorange = (220, 110, 30, 255)
white    = (255, 255, 255, 255)
black    = (30, 30, 30, 255)
pink     = (255, 180, 180, 200)
llyellow = (255, 240, 200, 255)

# shadow
draw.ellipse([cx-80, cy+90, cx+80, cy+110], fill=(0,0,0,25))

# === body ===
draw.ellipse([cx-70, cy+10, cx+70, cy+90], fill=orange, outline=dkorange, width=2)

# belly
draw.ellipse([cx-35, cy+30, cx+35, cy+80], fill=llyellow)

# body stripes
for sx in [-50, -30, 30, 50]:
    draw.arc([sx+cx-5, cy+15, sx+cx+5, cy+50], 0, 180, fill=dkorange, width=3)
for sx in [-40, -20, 20, 40]:
    draw.arc([sx+cx-5, cy+45, sx+cx+5, cy+75], 0, 180, fill=dkorange, width=3)

# === head ===
draw.ellipse([cx-60, cy-55, cx+60, cy+25], fill=orange, outline=dkorange, width=2)

# ears
draw.polygon([cx-45, cy-55, cx-55, cy-90, cx-25, cy-60], fill=orange, outline=dkorange, width=2)
draw.polygon([cx+45, cy-55, cx+55, cy-90, cx+25, cy-60], fill=orange, outline=dkorange, width=2)
# inner ears
draw.polygon([cx-40, cy-58, cx-48, cy-82, cx-30, cy-62], fill=pink)
draw.polygon([cx+40, cy-58, cx+48, cy-82, cx+30, cy-62], fill=pink)

# white face patches
draw.ellipse([cx-40, cy-20, cx-5, cy+15], fill=white)
draw.ellipse([cx+5, cy-20, cx+40, cy+15], fill=white)
draw.ellipse([cx-20, cy+5, cx+20, cy+25], fill=llyellow)

# cheeks
draw.ellipse([cx-48, cy-8, cx-30, cy+5], fill=llyellow)
draw.ellipse([cx+30, cy-8, cx+48, cy+5], fill=llyellow)

# nose
draw.polygon([cx-6, cy-2, cx+6, cy-2, cx, cy+6], fill=pink)

# mouth
draw.arc([cx-10, cy-2, cx, cy+8], 0, 180, fill=black, width=1)
draw.arc([cx, cy-2, cx+10, cy+8], 0, 180, fill=black, width=1)

# eyes
draw.ellipse([cx-25, cy-28, cx-10, cy-14], fill=white)
draw.ellipse([cx+10, cy-28, cx+25, cy-14], fill=white)
draw.ellipse([cx-22, cy-24, cx-14, cy-18], fill=black)
draw.ellipse([cx+14, cy-24, cx+22, cy-18], fill=black)
# eye glints
draw.ellipse([cx-20, cy-23, cx-17, cy-20], fill=white)
draw.ellipse([cx+16, cy-23, cx+19, cy-20], fill=white)

# eyebrows
draw.arc([cx-30, cy-40, cx-10, cy-28], 0, 180, fill=black, width=2)
draw.arc([cx+10, cy-40, cx+30, cy-28], 0, 180, fill=black, width=2)

# forehead stripes
draw.text((cx-20, cy-55), "王", fill=black, font=None)

# === tail ===
tail_points = []
for t in range(0, 181, 5):
    rad = math.radians(t)
    tx = cx + 75 + 30 * math.cos(rad)
    ty = cy - 5 + 40 * math.sin(rad)
    tail_points.append((tx, ty))
if len(tail_points) > 1:
    draw.line(tail_points, fill=orange, width=10)
    # tail stripes
    for i in range(30, 151, 20):
        rad = math.radians(i)
        tx = cx + 75 + 30 * math.cos(rad)
        ty = cy - 5 + 40 * math.sin(rad)
        draw.line([(tx-6, ty-3), (tx+6, ty+3)], fill=black, width=4)
    # tail tip
    draw.ellipse([cx+95, cy-52, cx+115, cy-35], fill=orange, outline=black, width=2)

# arms
draw.ellipse([cx-78, cy+30, cx-55, cy+55], fill=orange, outline=dkorange, width=2)
draw.ellipse([cx+55, cy+30, cx+78, cy+55], fill=orange, outline=dkorange, width=2)

# legs
draw.ellipse([cx-40, cy+75, cx-15, cy+100], fill=orange, outline=dkorange, width=2)
draw.ellipse([cx+15, cy+75, cx+40, cy+100], fill=orange, outline=dkorange, width=2)
# paws
draw.ellipse([cx-42, cy+90, cx-13, cy+103], fill=llyellow)
draw.ellipse([cx+13, cy+90, cx+42, cy+103], fill=llyellow)

img.save("G:\\我的雲端硬碟\\AI小工具\\tiger_icon.png")
print("tiger_icon.png saved")
