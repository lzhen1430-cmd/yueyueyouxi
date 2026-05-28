"""
Generate high-quality transparent PNG dress-up assets for the AR game.
Each asset is drawn with gradients, shadows, and detail to look like
real illustrations. All outputs go to public/assets/dressup/
"""
import math, os, json, random
from PIL import Image, ImageDraw

OUT = "public/assets/dressup"
os.makedirs(OUT, exist_ok=True)

def circle_mask(draw, cx, cy, r, fill):
    """Draw a smooth circle."""
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill)

def oval_gradient(size, color1, color2, angle=0):
    """Create an image with a linear gradient from color1 to color2."""
    w, h = size
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    for y in range(h):
        t = y / h
        r = int(color1[0] + (color2[0]-color1[0])*t)
        g = int(color1[1] + (color2[1]-color1[1])*t)
        b = int(color1[2] + (color2[2]-color1[2])*t)
        for x in range(w):
            img.putpixel((x,y), (r,g,b,255))
    return img

def blend_colors(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))


# ============================================================
#  1. Golden Crown / Tiara
# ============================================================
def make_crown():
    s = 400
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Crown body - 5 points
    cx, base_y = s//2, s-30
    pts = []
    peaks = 5
    for i in range(peaks*2):
        angle = -math.pi/2 + (i * math.pi / (peaks*2-1)) - math.pi/(peaks*4)
        if i % 2 == 0:
            r = s*0.42  # peak
        else:
            r = s*0.28  # valley
        x = cx + math.cos(angle) * r
        y = base_y + math.sin(angle) * r
        pts.append((x, y))

    pts.append((cx - s*0.32, base_y))
    pts.append((cx + s*0.32, base_y))

    # Gold gradient: light gold -> darker gold
    gold_light = (255, 215, 0)
    gold_mid = (218, 165, 32)
    gold_dark = (184, 134, 11)

    # Shadow
    d.polygon([(p[0]+3, p[1]+3) for p in pts], fill=(0,0,0,60))
    # Main body
    d.polygon(pts, fill=gold_mid)
    # Highlight top area
    highlight_pts = [p for p in pts[:peaks*2]] + [pts[-2], pts[-1]]
    # Inner lighter fill
    for i, p in enumerate(pts):
        if i < len(pts)-2:
            shade = blend_colors(gold_light, gold_mid, i/len(pts))
            # Draw a subtle stripe
            pass

    # Jewels (gems at each peak)
    jewel_colors = [(220,20,60), (138,43,226), (0,191,255), (255,105,180), (220,20,60)]
    for i in range(peaks):
        px, py = pts[i*2]
        # Gem glow
        d.ellipse([px-16, py-4, px+16, py+22], fill=(0,0,0,40))
        # Gem
        for layer in range(3):
            r_adj = 10 - layer*3
            c = blend_colors(jewel_colors[i], (255,255,255), layer*0.15)
            d.ellipse([px-r_adj, py-r_adj+6, px+r_adj, py+r_adj+6], fill=c)
        # Gem highlight
        d.ellipse([px-4, py-2, px+4, py+6], fill=(255,255,255,180))

    # Bottom band
    band_top = base_y - 10
    band_bot = base_y + 18
    d.rectangle([cx-s*0.3, band_top, cx+s*0.3, band_bot], fill=gold_dark)
    # Band highlight
    d.rectangle([cx-s*0.28, band_top+2, cx+s*0.28, band_top+6], fill=gold_light + (120,))

    # Sparkle dots
    for _ in range(12):
        sx = cx + (random.random()-0.5)*s*0.5
        sy = base_y - random.random()*s*0.45
        r = random.random()*3+1
        d.ellipse([sx-r, sy-r, sx+r, sy+r], fill=(255,255,255,200))

    img.save(f"{OUT}/crown_gold.png")
    print("  crown_gold.png")


# ============================================================
#  2. Pink Princess Dress
# ============================================================
def make_dress(name, main_color, accent_color, highlight_color):
    s = 500
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, top_y = s//2, 60

    # Bodice (top part)
    bodice_w, bodice_h = 80, 100
    bodice_top = top_y + 20
    d.polygon([
        (cx - bodice_w//2, bodice_top),
        (cx + bodice_w//2, bodice_top),
        (cx + bodice_w//2 + 25, bodice_top + bodice_h),
        (cx - bodice_w//2 - 25, bodice_top + bodice_h),
    ], fill=main_color)

    # Bodice details
    d.line([(cx, bodice_top), (cx, bodice_top + bodice_h)], fill=accent_color, width=2)
    for i in range(3):
        by = bodice_top + 25 + i*20
        d.ellipse([cx-3, by-3, cx+3, by+3], fill=highlight_color)

    # Skirt (bell shape)
    skirt_top = bodice_top + bodice_h
    skirt_bottom = s - 20
    skirt_width_top = bodice_w//2 + 40
    skirt_width_bottom = s//2 - 10

    # Skirt layers
    for layer in range(4):
        sw_top = skirt_width_top + layer*8
        sw_bot = skirt_width_bottom + layer*5
        st = skirt_top + layer*3
        layer_color = blend_colors(main_color, highlight_color, layer*0.12)
        d.polygon([
            (cx - sw_top, st),
            (cx + sw_top, st),
            (cx + sw_bot, skirt_bottom + layer*10),
            (cx - sw_bot, skirt_bottom + layer*10),
        ], fill=layer_color)

    # Waist ribbon
    ribbon_y = skirt_top
    ribbon_w = skirt_width_top + 15
    d.ellipse([cx-ribbon_w, ribbon_y-8, cx+ribbon_w, ribbon_y+12], fill=accent_color)
    # Bow at center
    bow_cx, bow_cy = cx, ribbon_y
    for side in [-1, 1]:
        x1 = min(bow_cx + side*15, bow_cx + side*35)
        x2 = max(bow_cx + side*15, bow_cx + side*35)
        d.ellipse([x1, bow_cy-18, x2, bow_cy+8], fill=accent_color)
    d.ellipse([bow_cx-8, bow_cy-8, bow_cx+8, bow_cy+8], fill=highlight_color)

    # Sparkles on skirt
    for _ in range(20):
        sx = cx + (random.random()-0.5)*s*0.7
        sy = skirt_top + random.random()*(skirt_bottom - skirt_top)*0.8
        r = random.random()*2+1
        d.ellipse([sx-r, sy-r, sx+r, sy+r], fill=(255,255,255,180))

    img.save(f"{OUT}/{name}.png")
    print(f"  {name}.png")


# ============================================================
#  3. Cat Ears Headband
# ============================================================
def make_cat_ears():
    s = 400
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, base_y = s//2, s-40
    ear_h = 140
    ear_w = 55

    # Headband
    d.arc([cx-100, base_y-80, cx+100, base_y+80], 180, 360, fill=(80,60,100), width=8)

    ears = []
    for side in [-1, 1]:
        ex = cx + side*65
        ey = base_y - 55

        # Outer ear (black/dark gray)
        outer = [(ex - ear_w*side, ey), (ex, ey - ear_h), (ex + ear_w*0.4*side, ey)]
        # Shadow
        d.polygon([(p[0]+2,p[1]+2) for p in outer], fill=(0,0,0,30))
        # Main outer
        d.polygon(outer, fill=(60,55,75))

        # Inner ear (pink)
        inner = [
            (ex - ear_w*0.6*side, ey + ear_h*0.1),
            (ex, ey - ear_h*0.8),
            (ex + ear_w*0.1*side, ey + ear_h*0.1)
        ]
        d.polygon(inner, fill=(255,182,193))

        # Ear tip highlight
        d.ellipse([ex-4, ey-ear_h+10, ex+4, ey-ear_h+18], fill=(255,220,230,150))
        ears.append((ex, ey))

    # Fur tufts at base
    for ex, ey in ears:
        for t in range(3):
            tx = ex + (t-1)*10
            d.ellipse([tx-6, ey-12, tx+6, ey], fill=(60,55,75))

    img.save(f"{OUT}/cat_ears.png")
    print("  cat_ears.png")


# ============================================================
#  4. Bunny Ears Headband
# ============================================================
def make_bunny_ears():
    s = 400
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, base_y = s//2, s-40
    ear_h = 170
    ear_w = 40

    # Headband
    d.arc([cx-100, base_y-80, cx+100, base_y+80], 180, 360, fill=(200,180,220), width=8)

    for side in [-1, 1]:
        ex = cx + side*55
        ey = base_y - 50

        # Ear - tall oval
        d.ellipse([ex-ear_w, ey-ear_h, ex+ear_w, ey], fill=(255,245,250))

        # Inner ear
        d.ellipse([ex-ear_w*0.5, ey-ear_h*0.85, ex+ear_w*0.5, ey-ear_h*0.05], fill=(255,200,220,180))

        # Highlight
        d.ellipse([ex-ear_w*0.3, ey-ear_h*0.85, ex+ear_w*0.1, ey-ear_h*0.5], fill=(255,255,255,120))

        # Ear outline
        d.ellipse([ex-ear_w-2, ey-ear_h-2, ex+ear_w+2, ey+2], outline=(230,210,240), width=3)

    img.save(f"{OUT}/bunny_ears.png")
    print("  bunny_ears.png")


# ============================================================
#  5. Sunglasses
# ============================================================
def make_sunglasses():
    s = 400
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, cy = s//2, s//2 - 20
    lens_w, lens_h = 65, 50
    bridge = 18

    # Frame color
    frame_color = (40, 35, 45)

    for side in [-1, 1]:
        lx = cx + side*(lens_w//2 + bridge//2)

        # Lens
        d.ellipse([lx-lens_w, cy-lens_h, lx+lens_w, cy+lens_h], fill=(20,20,30))

        # Gradient/shine on lens
        for i in range(3):
            shine_y = cy - lens_h + i*15
            alpha = 80 - i*25
            d.ellipse([lx-lens_w*0.5, shine_y, lx+lens_w*0.2, shine_y+lens_h*0.3],
                      fill=(100,180,255, max(0,alpha)))

        # Frame
        d.ellipse([lx-lens_w-4, cy-lens_h-4, lx+lens_w+4, cy+lens_h+4],
                  outline=frame_color, width=6)

    # Bridge
    d.line([(cx-bridge//2, cy), (cx+bridge//2, cy)], fill=frame_color, width=5)

    # Arms
    for side in [-1, 1]:
        ax = cx + side*(lens_w + bridge//2)
        d.line([(ax+side*4, cy), (ax+side*80, cy-20)], fill=frame_color, width=5)

    img.save(f"{OUT}/sunglasses.png")
    print("  sunglasses.png")


# ============================================================
#  6. Pearl Necklace
# ============================================================
def make_necklace():
    s = 350
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, cy = s//2, 40
    r = 120

    # String of pearls in an arc
    n_pearls = 20
    for i in range(n_pearls):
        angle = math.pi + (i * math.pi / (n_pearls-1))
        px = cx + math.cos(angle) * r * 0.85
        py = cy + r*0.6 + math.sin(angle) * r * 0.6

        pr = 10 + (i % 3)  # slightly varied sizes

        # Pearl
        for layer in range(3):
            lr = pr - layer*2
            shade = blend_colors((255,250,240), (220,210,200), layer*0.3)
            d.ellipse([px-lr, py-lr, px+lr, py+lr], fill=shade)
        # Shine
        d.ellipse([px-3, py-pr+2, px+3, py-pr+8], fill=(255,255,255,200))

    # Pendant
    px = cx
    py = cy + r*1.15
    d.ellipse([px-18, py-18, px+18, py+18], fill=(255,105,180))
    d.ellipse([px-14, py-14, px+14, py+14], fill=(255,20,147))
    d.ellipse([px-6, py-6, px+2, py+6], fill=(255,255,255,150))

    img.save(f"{OUT}/necklace.png")
    print("  necklace.png")


# ============================================================
#  7. Red Hair Bow
# ============================================================
def make_bow(name, color1, color2):
    s = 250
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, cy = s//2, s//2

    # Bow loops
    for side in [-1, 1]:
        x1 = min(cx + side*10, cx + side*75)
        x2 = max(cx + side*10, cx + side*75)
        d.ellipse([x1, cy-45, x2, cy+45], fill=color1)
        x1 = min(cx + side*12, cx + side*65)
        x2 = max(cx + side*12, cx + side*65)
        d.ellipse([x1, cy-35, x2, cy+35], fill=color2)
        # Fold line
        ax1 = min(cx + side*15, cx + side*55)
        ax2 = max(cx + side*15, cx + side*55)
        d.arc([ax1, cy-25, ax2, cy+25], 200, 340, fill=color1, width=2)

    # Center knot
    d.ellipse([cx-18, cy-18, cx+18, cy+18], fill=blend_colors(color1, (0,0,0), 0.2))
    d.ellipse([cx-12, cy-12, cx+12, cy+12], fill=color1)
    d.ellipse([cx-6, cy-6, cx+4, cy+6], fill=(255,255,255,120))

    # Ribbon tails
    for side in [-1, 1]:
        d.polygon([
            (cx + side*8, cy+15),
            (cx + side*30, cy+70),
            (cx + side*12, cy+65),
            (cx + side*5, cy+18),
        ], fill=color1)

    img.save(f"{OUT}/{name}.png")
    print(f"  {name}.png")


# ============================================================
#  8. Butterfly/Fairy Wings
# ============================================================
def make_wings():
    s = 500
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, cy = s//2, s//2 - 20

    for side in [-1, 1]:
        # Upper wing
        uw_cx = cx + side*30
        uw_cy = cy - 60
        uw_w, uw_h = 90, 130
        ux1 = min(uw_cx-side*uw_w, uw_cx+side*uw_w*0.3)
        ux2 = max(uw_cx-side*uw_w, uw_cx+side*uw_w*0.3)
        d.ellipse([ux1, uw_cy-uw_h, ux2, uw_cy+uw_h*0.3],
                  fill=(180,220,255,200))
        ux1 = min(uw_cx-side*uw_w+10, uw_cx+side*uw_w*0.2)
        ux2 = max(uw_cx-side*uw_w+10, uw_cx+side*uw_w*0.2)
        d.ellipse([ux1, uw_cy-uw_h+10, ux2, uw_cy+uw_h*0.2],
                  fill=(220,240,255,180))
        # Wing veins
        vx1 = min(uw_cx-side*uw_w*0.6, uw_cx)
        vx2 = max(uw_cx-side*uw_w*0.6, uw_cx)
        d.arc([vx1, uw_cy-uw_h*0.5, vx2, uw_cy+uw_h*0.3],
              200, 340, fill=(255,255,255,100), width=2)

        # Lower wing
        lw_cx = cx + side*35
        lw_cy = cy + 20
        lw_w, lw_h = 65, 90
        lx1 = min(lw_cx-side*lw_w, lw_cx+side*lw_w*0.3)
        lx2 = max(lw_cx-side*lw_w, lw_cx+side*lw_w*0.3)
        d.ellipse([lx1, lw_cy-lw_h*0.3, lx2, lw_cy+lw_h*0.5],
                  fill=(200,230,255,200))
        lx1 = min(lw_cx-side*lw_w+8, lw_cx+side*lw_w*0.2)
        lx2 = max(lw_cx-side*lw_w+8, lw_cx+side*lw_w*0.2)
        d.ellipse([lx1, lw_cy-lw_h*0.2, lx2, lw_cy+lw_h*0.4],
                  fill=(235,245,255,180))

    # Glow particles
    for _ in range(15):
        px = cx + (random.random()-0.5)*200
        py = cy + (random.random()-0.5)*180
        r = random.random()*3+1
        d.ellipse([px-r, py-r, px+r, py+r], fill=(255,255,255,150))

    img.save(f"{OUT}/fairy_wings.png")
    print("  fairy_wings.png")


# ============================================================
#  9. Magic Wand (held by hand)
# ============================================================
def make_wand():
    s = 300
    img = Image.new('RGBA', (s, 90), (0,0,0,0))
    d = ImageDraw.Draw(img)

    # Stick
    d.rounded_rectangle([40, 35, 260, 55], 3, fill=(139,90,43))

    # Star at top
    star_cx, star_cy = 40, 45
    star_r = 28
    star_pts = []
    for i in range(5):
        angle = -math.pi/2 + i*2*math.pi/5
        x = star_cx + math.cos(angle)*star_r
        y = star_cy + math.sin(angle)*star_r
        star_pts.append((x, y))
        inner_angle = angle + math.pi/5
        ix = star_cx + math.cos(inner_angle)*star_r*0.4
        iy = star_cy + math.sin(inner_angle)*star_r*0.4
        star_pts.append((ix, iy))

    d.polygon(star_pts, fill=(255,215,0))
    d.polygon(star_pts, outline=(255,180,0), width=2)

    # Sparkles from star
    for _ in range(8):
        sx = star_cx + (random.random()-0.5)*60
        sy = star_cy + (random.random()-0.5)*60
        d.ellipse([sx-2, sy-2, sx+2, sy+2], fill=(255,255,200,180))

    # Ribbon at base of star
    d.ellipse([33, 38, 55, 52], fill=(255,100,150))
    d.ellipse([30, 42, 48, 48], fill=(255,150,200))

    img.save(f"{OUT}/magic_wand.png")
    print("  magic_wand.png")


# ============================================================
#  10. Flower Crown
# ============================================================
def make_flower_crown():
    s = 400
    img = Image.new('RGBA', (s, s), (0,0,0,0))
    d = ImageDraw.Draw(img)

    cx, cy = s//2, s//2
    r = 130

    flower_colors = [
        (255,105,180), (255,182,193), (255,215,0),
        (255,140,160), (255,220,180), (255,160,200),
        (255,200,150), (255,130,170)
    ]

    # Vine base
    for i in range(40):
        angle = i * 2*math.pi / 40
        vx = cx + math.cos(angle)*r
        vy = cy + math.sin(angle)*r*0.35
        d.ellipse([vx-4, vy-2, vx+4, vy+2], fill=(100,160,80,200))

    # Flowers
    for i, fc in enumerate(flower_colors):
        angle = i * 2*math.pi / len(flower_colors)
        fx = cx + math.cos(angle)*r
        fy = cy + math.sin(angle)*r*0.35

        # Petals
        for p in range(5):
            pa = p * 2*math.pi/5
            px = fx + math.cos(pa)*12
            py = fy + math.sin(pa)*12
            d.ellipse([px-8, py-8, px+8, py+8], fill=fc)
            d.ellipse([px-6, py-6, px+6, py+6], fill=blend_colors(fc, (255,255,255), 0.3))

        # Center
        d.ellipse([fx-5, fy-5, fx+5, fy+5], fill=(255,240,100))

    # Small leaves
    for i in range(8):
        la = i * 2*math.pi/8 + 0.3
        lx = cx + math.cos(la)*r
        ly = cy + math.sin(la)*r*0.35
        d.ellipse([lx-6, ly-12, lx+6, ly+4], fill=(120,180,90,200))

    img.save(f"{OUT}/flower_crown.png")
    print("  flower_crown.png")


# ============================================================
#  Generate items.json manifest
# ============================================================
ITEMS = [
    {"id":"crown_gold",   "name":"金色皇冠",   "nameEn":"Crown",        "type":"head",    "src":"assets/dressup/crown_gold.png",    "anchor":"head",    "scale":0.65, "offsetY":-0.55},
    {"id":"flower_crown", "name":"花环",       "nameEn":"Flower Crown", "type":"head",    "src":"assets/dressup/flower_crown.png",  "anchor":"head",    "scale":0.55, "offsetY":-0.35},
    {"id":"cat_ears",     "name":"猫耳朵",     "nameEn":"Cat Ears",     "type":"head",    "src":"assets/dressup/cat_ears.png",      "anchor":"head",    "scale":0.5 , "offsetY":-0.7},
    {"id":"bunny_ears",   "name":"兔耳朵",     "nameEn":"Bunny Ears",   "type":"head",    "src":"assets/dressup/bunny_ears.png",    "anchor":"head",    "scale":0.5 , "offsetY":-0.75},
    {"id":"sunglasses",   "name":"酷酷墨镜",   "nameEn":"Sunglasses",   "type":"face",    "src":"assets/dressup/sunglasses.png",    "anchor":"eyes",    "scale":0.55, "offsetY":0},
    {"id":"necklace",     "name":"珍珠项链",   "nameEn":"Necklace",     "type":"neck",    "src":"assets/dressup/necklace.png",      "anchor":"neck",    "scale":0.6 , "offsetY":0.1},
    {"id":"bow_red",      "name":"红色蝴蝶结", "nameEn":"Red Bow",      "type":"head",    "src":"assets/dressup/bow_red.png",       "anchor":"head",    "scale":0.45, "offsetY":0.1},
    {"id":"fairy_wings",  "name":"仙女翅膀",   "nameEn":"Fairy Wings",  "type":"body",    "src":"assets/dressup/fairy_wings.png",   "anchor":"shoulders","scale":0.65,"offsetY":-0.1},
    {"id":"dress_pink",   "name":"粉色公主裙", "nameEn":"Pink Dress",   "type":"body",    "src":"assets/dressup/dress_pink.png",    "anchor":"body",    "scale":0.75, "offsetY":0.15},
    {"id":"dress_purple", "name":"紫色公主裙", "nameEn":"Purple Dress", "type":"body",    "src":"assets/dressup/dress_purple.png",  "anchor":"body",    "scale":0.75, "offsetY":0.15},
]

with open(f"{OUT}/items.json", "w", encoding="utf-8") as f:
    json.dump(ITEMS, f, ensure_ascii=False, indent=2)
print("\n  items.json")


# ============================================================
#  Main
# ============================================================
if __name__ == "__main__":
    random.seed(42)
    print("Generating dress-up assets...\n")

    make_crown()
    make_dress("dress_pink", (255,105,140), (255,80,120), (255,180,200))
    make_dress("dress_purple", (160,100,200), (130,70,180), (210,180,240))
    make_cat_ears()
    make_bunny_ears()
    make_sunglasses()
    make_necklace()
    make_bow("bow_red", (255,60,80), (255,120,140))
    make_wings()
    make_wand()
    make_flower_crown()

    print(f"\nDone! {len(ITEMS)} assets + items.json -> {OUT}/")
