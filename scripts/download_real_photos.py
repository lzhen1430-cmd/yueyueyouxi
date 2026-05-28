"""
Download real photos from free sources, remove backgrounds with rembg AI.
Sources tried in order: loremflickr (Flickr), direct URLs.
"""
import os, sys, json, requests, time
from PIL import Image
from rembg import remove
from io import BytesIO

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "dressup")
os.makedirs(OUT, exist_ok=True)

os.environ['PYTHONIOENCODING'] = 'utf-8'

# Each item: (id, name_cn, name_en, type, anchor, scale, offsetY, search_keywords)
ITEMS = [
    ("crown_real",   "金色皇冠",   "Golden Crown",      "head", "head",     0.50, -0.55, ["crown","tiara","gold"]),
    ("dress_pink_r", "粉色公主裙", "Pink Princess Dress","body", "body",     0.75,  0.15, ["pink+dress","princess+dress","girl+dress"]),
    ("dress_blue_r", "蓝色公主裙", "Blue Princess Dress","body", "body",     0.75,  0.15, ["blue+dress","princess+gown","blue+gown"]),
    ("necklace_r",   "珍珠项链",   "Pearl Necklace",    "neck", "neck",     0.50,  0.10, ["necklace","pearl+necklace","jewelry"]),
    ("sunglasses_r", "酷酷墨镜",   "Cool Sunglasses",   "face", "eyes",     0.50,  0.00, ["sunglasses","cool+sunglasses","shades"]),
    ("cat_ears_r",   "猫耳朵发箍", "Cat Ears Headband", "head", "head",     0.45, -0.65, ["cat+ears","headband","cat+costume"]),
    ("bow_red_r",    "红色蝴蝶结", "Red Hair Bow",      "head", "head",     0.40,  0.10, ["red+bow","hair+bow","ribbon+bow"]),
    ("wings_r",      "仙女翅膀",   "Fairy Wings",       "body", "shoulders",0.60, -0.10, ["fairy+wings","butterfly+wings","angel+wings"]),
    ("flower_crown_r","鲜花花环",  "Flower Crown",      "head", "head",     0.55, -0.35, ["flower+crown","floral+crown","flower+headband"]),
    ("wand_r",       "魔法棒",     "Magic Wand",        "body", "shoulders",0.40,  0.00, ["magic+wand","princess+wand","star+wand"]),
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def download_from_loremflickr(keywords, width=800, height=800):
    """Download random image from loremflickr (pulls from Flickr)."""
    for kw in keywords:
        url = f"https://loremflickr.com/{width}/{height}/{kw}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
            if resp.status_code == 200 and len(resp.content) > 5000:
                # Check it's actually an image
                if resp.headers.get('content-type', '').startswith('image/'):
                    return resp.content
        except Exception:
            continue
        time.sleep(0.3)
    return None

def process_image(img_data, out_path, max_dim=600):
    """Remove background with AI and save as transparent PNG."""
    try:
        img = Image.open(BytesIO(img_data)).convert("RGBA")
        w, h = img.size
        print(f"    Image: {w}x{h}, running AI bg removal...")
        result = remove(img)

        # Resize if too large
        w, h = result.size
        if max(w, h) > max_dim:
            sc = max_dim / max(w, h)
            nw, nh = int(w * sc), int(h * sc)
            result = result.resize((nw, nh), Image.LANCZOS)
            print(f"    Resized: {w}x{h} -> {nw}x{nh}")

        result.save(out_path, "PNG", optimize=True)
        kb = os.path.getsize(out_path) / 1024
        print(f"    Saved: {out_path} ({kb:.0f}KB)")
        return True
    except Exception as e:
        print(f"    Error: {e}")
        return False

def main():
    print("=" * 60)
    print("Downloading real dress-up photos (loremflickr + rembg)")
    print("=" * 60)

    success = []

    for item_id, name_cn, name_en, item_type, anchor, scale, offset_y, keywords in ITEMS:
        out_path = os.path.join(OUT, f"{item_id}.png")
        if os.path.exists(out_path):
            print(f"\n[{name_cn}] Already exists, skipping.")
            success.append((item_id, name_cn, name_en, item_type, anchor, scale, offset_y))
            continue

        print(f"\n[{name_cn}] Searching: {', '.join(keywords[:2])}...")
        img_data = download_from_loremflickr(keywords)

        if not img_data:
            print(f"  FAILED: No image found")
            continue

        print(f"  Downloaded {len(img_data)} bytes, processing...")
        if process_image(img_data, out_path):
            success.append((item_id, name_cn, name_en, item_type, anchor, scale, offset_y))
            time.sleep(1)  # cooldown between processing
        else:
            if os.path.exists(out_path):
                os.remove(out_path)

    # Build items.json
    print(f"\n{'=' * 60}")
    print(f"Done: {len(success)}/{len(ITEMS)} items processed")

    if success:
        # New real items
        new_items = []
        for item_id, name_cn, name_en, item_type, anchor, scale, offset_y in success:
            new_items.append({
                "id": item_id,
                "name": name_cn,
                "nameEn": name_en,
                "type": item_type,
                "src": f"assets/dressup/{item_id}.png",
                "anchor": anchor,
                "scale": scale,
                "offsetY": offset_y
            })

        # Merge with existing items
        old_json = os.path.join(OUT, "items.json")
        all_items = []
        if os.path.exists(old_json):
            with open(old_json, 'r', encoding='utf-8') as f:
                all_items = json.load(f)

        # Replace old items with real versions where IDs overlap
        new_ids = {it['id'] for it in new_items}
        all_items = [it for it in all_items if it['id'] not in new_ids]
        all_items = new_items + all_items

        with open(old_json, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
        print(f"items.json updated: {len(all_items)} total items")

    print("\nTip: To add your own photos:")
    print("  python scripts/process_photo.py photo.jpg --name 'Name' --name-en 'Name' --type body --anchor body --scale 0.7")

if __name__ == "__main__":
    main()
