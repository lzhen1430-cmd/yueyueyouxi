"""
Download real photos from Pixabay, remove backgrounds with AI (rembg),
and save as transparent PNGs for the AR dress-up game.
"""
import os, json, requests
from PIL import Image
from rembg import remove
from io import BytesIO

OUT = "public/assets/dressup"
os.makedirs(OUT, exist_ok=True)

# Pixabay images to download (manually found free photos)
# Format: (output_name, pixabay_image_id, search_term)
PIXABAY_PHOTOS = {
    # Crown/tiara - real photos
    "crown_real": "https://cdn.pixabay.com/photo/2023/11/16/20/54/crown-8390270_1280.jpg",
    "crown_gold": "https://cdn.pixabay.com/photo/2015/11/06/13/28/gold-1027918_1280.jpg",

    # Princess dress
    "dress_blue": "https://cdn.pixabay.com/photo/2021/01/18/09/23/woman-5946579_1280.jpg",
    "dress_white": "https://cdn.pixabay.com/photo/2024/10/19/14/44/woman-9150902_1280.jpg",

    # Accessories
    "necklace_pearl": "https://cdn.pixabay.com/photo/2017/03/23/12/09/necklace-2168272_1280.jpg",
    "sunglasses_real": "https://cdn.pixabay.com/photo/2017/03/14/15/46/sunglasses-2143492_1280.jpg",
    "bow_hair": "https://cdn.pixabay.com/photo/2016/04/01/09/53/bow-1299704_1280.png",

    # Wings / costume
    "wings_fairy": "https://cdn.pixabay.com/photo/2019/08/25/12/16/butterfly-4429562_1280.jpg",

    # Cat ears headband
    "cat_ears_real": "https://cdn.pixabay.com/photo/2017/08/07/14/07/cat-2603712_1280.jpg",
}

def download_and_process(name, url):
    """Download image from URL, remove background, save as PNG."""
    out_path = os.path.join(OUT, f"{name}.png")

    try:
        print(f"  Downloading {name}...", end=" ")
        resp = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        if resp.status_code != 200:
            print(f"FAILED (HTTP {resp.status_code})")
            return None

        print(f"OK ({len(resp.content)} bytes), removing bg...", end=" ")

        # Remove background with AI
        img = Image.open(BytesIO(resp.content)).convert("RGBA")
        result = remove(img)

        # Resize if too large (max 600px)
        w, h = result.size
        max_dim = max(w, h)
        if max_dim > 600:
            scale = 600 / max_dim
            new_w, new_h = int(w * scale), int(h * scale)
            result = result.resize((new_w, new_h), Image.LANCZOS)

        result.save(out_path, "PNG", optimize=True)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"DONE ({size_kb:.0f}KB)")
        return True

    except Exception as e:
        print(f"ERROR: {e}")
        return None

def main():
    print("=== Downloading real dress-up assets with AI background removal ===\n")
    print("This may take a few minutes (AI model runs on first image)...\n")

    success = []
    for name, url in PIXABAY_PHOTOS.items():
        if download_and_process(name, url):
            success.append(name)

    print(f"\n=== Downloaded {len(success)}/{len(PIXABAY_PHOTOS)} assets ===")

    # Update items.json with real assets
    items = [
        {"id":"crown_gold","name":"金色皇冠","nameEn":"Crown","type":"head","src":"assets/dressup/crown_gold.png","anchor":"head","scale":0.5,"offsetY":-0.55},
        {"id":"crown_real","name":"公主皇冠","nameEn":"Tiara","type":"head","src":"assets/dressup/crown_real.png","anchor":"head","scale":0.45,"offsetY":-0.5},
        {"id":"cat_ears_real","name":"猫耳朵","nameEn":"Cat Ears","type":"head","src":"assets/dressup/cat_ears_real.png","anchor":"head","scale":0.45,"offsetY":-0.65},
        {"id":"sunglasses_real","name":"酷酷墨镜","nameEn":"Sunglasses","type":"face","src":"assets/dressup/sunglasses_real.png","anchor":"eyes","scale":0.5,"offsetY":0},
        {"id":"necklace_pearl","name":"珍珠项链","nameEn":"Necklace","type":"neck","src":"assets/dressup/necklace_pearl.png","anchor":"neck","scale":0.5,"offsetY":0.1},
        {"id":"bow_hair","name":"蝴蝶结","nameEn":"Hair Bow","type":"head","src":"assets/dressup/bow_hair.png","anchor":"head","scale":0.4,"offsetY":0.1},
        {"id":"wings_fairy","name":"仙女翅膀","nameEn":"Fairy Wings","type":"body","src":"assets/dressup/wings_fairy.png","anchor":"shoulders","scale":0.6,"offsetY":-0.1},
        {"id":"dress_blue","name":"蓝色公主裙","nameEn":"Blue Dress","type":"body","src":"assets/dressup/dress_blue.png","anchor":"body","scale":0.7,"offsetY":0.15},
        {"id":"dress_white","name":"白色公主裙","nameEn":"White Dress","type":"body","src":"assets/dressup/dress_white.png","anchor":"body","scale":0.7,"offsetY":0.15},
    ]

    with open(os.path.join(OUT, "items.json"), "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"Updated items.json with {len(items)} items")

if __name__ == "__main__":
    main()
