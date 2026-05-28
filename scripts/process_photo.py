"""
Process real photos into transparent PNG dress-up assets.
Usage: python scripts/process_photo.py path/to/photo.jpg --name "粉色公主裙" --name-en "Pink Dress" --type body --anchor body --scale 0.7
"""
import os, sys, json, argparse
from PIL import Image
from rembg import remove

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "dressup")
ITEMS_JSON = os.path.join(OUT, "items.json")

VALID_TYPES = ['head', 'face', 'neck', 'body']
VALID_ANCHORS = ['head', 'eyes', 'neck', 'shoulders', 'body']

def process_photo(photo_path, name, name_en, item_type, anchor, scale, offset_y):
    """Remove background from photo and save as transparent PNG."""
    os.makedirs(OUT, exist_ok=True)

    # Generate safe ID
    item_id = name_en.lower().replace(' ', '_').replace("'", '').replace('"', '')

    print(f"Processing: {photo_path}")
    print(f"  Name: {name} ({name_en})")
    print(f"  Type: {item_type}, Anchor: {anchor}, Scale: {scale}")

    # Remove background
    img = Image.open(photo_path).convert("RGBA")
    print("  Running AI background removal...")
    result = remove(img)

    # Resize if too large
    w, h = result.size
    max_dim = max(w, h)
    if max_dim > 600:
        new_scale = 600 / max_dim
        new_w, new_h = int(w * new_scale), int(h * new_scale)
        result = result.resize((new_w, new_h), Image.LANCZOS)
        print(f"  Resized: {w}x{h} -> {new_w}x{new_h}")

    # Save
    out_path = os.path.join(OUT, f"{item_id}.png")
    result.save(out_path, "PNG", optimize=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  Saved: {out_path} ({size_kb:.0f}KB)")

    # Update items.json
    update_items_json(item_id, name, name_en, item_type, anchor, scale, offset_y)

    print(f"\nDone! '{name}' is now available in the game. Refresh to see it.")

    return item_id

def update_items_json(item_id, name, name_en, item_type, anchor, scale, offset_y):
    """Add or update item in items.json."""
    items = []
    if os.path.exists(ITEMS_JSON):
        with open(ITEMS_JSON, 'r', encoding='utf-8') as f:
            items = json.load(f)

    # Check if already exists
    for item in items:
        if item['id'] == item_id:
            print(f"  Updating existing item '{item_id}'")
            item['name'] = name
            item['nameEn'] = name_en
            item['type'] = item_type
            item['src'] = f"assets/dressup/{item_id}.png"
            item['anchor'] = anchor
            item['scale'] = scale
            item['offsetY'] = offset_y
            break
    else:
        items.append({
            "id": item_id,
            "name": name,
            "nameEn": name_en,
            "type": item_type,
            "src": f"assets/dressup/{item_id}.png",
            "anchor": anchor,
            "scale": scale,
            "offsetY": offset_y
        })

    with open(ITEMS_JSON, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Process photo into dress-up asset')
    parser.add_argument('photo', help='Path to photo file')
    parser.add_argument('--name', required=True, help='Chinese name (e.g. 粉色公主裙)')
    parser.add_argument('--name-en', required=True, help='English name (e.g. Pink Dress)')
    parser.add_argument('--type', required=True, choices=VALID_TYPES, help='Item type')
    parser.add_argument('--anchor', required=True, choices=VALID_ANCHORS, help='Body anchor point')
    parser.add_argument('--scale', type=float, default=0.6, help='Display scale (0.3-1.0)')
    parser.add_argument('--offset-y', type=float, default=0, help='Vertical offset')
    args = parser.parse_args()

    if not os.path.exists(args.photo):
        print(f"Error: File not found: {args.photo}")
        sys.exit(1)

    process_photo(
        args.photo, args.name, args.name_en,
        args.type, args.anchor, args.scale, args.offset_y
    )

if __name__ == "__main__":
    main()
