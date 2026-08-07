import os
import requests
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Configuration
INPUT_DIR = "assets"
OUTPUT_DIR = "assets/play_store_screens"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1440x2560 is a great high-res format for Play Store
W, H = 1440, 2560 

# Download Font
font_path = "Outfit-Bold.ttf"
if not os.path.exists(font_path):
    print("Downloading font...")
    url = "https://github.com/googlefonts/outfit/raw/main/fonts/ttf/Outfit-Bold.ttf"
    r = requests.get(url)
    with open(font_path, 'wb') as f:
        f.write(r.content)

# Define Captions (9 screenshots)
captions = [
    ("100+ INSTANT GAMES", "Zero Downloads Required"),
    ("PLAY INSTANTLY", "No Installs, No Waiting"),
    ("ENDLESS VARIETY", "Action, Puzzle, Racing & More"),
    ("SAVE FAVORITES", "1-Tap Quick Play"),
    ("SEARCH & DISCOVER", "Find Your Next Obsession"),
    ("BEAUTIFUL DESIGN", "Sleek Dark Obsidian Theme"),
    ("GLOBAL ACCESS", "Available in 45 Languages"),
    ("SEAMLESS EXPERIENCE", "Play Anywhere, Anytime"),
    ("YOUR ARCADE", "All in One Place")
]

# Find input images
valid_extensions = ('.jpg', '.jpeg', '.png')
input_files = [f for f in os.listdir(INPUT_DIR) if f.startswith('WhatsApp Image') and f.lower().endswith(valid_extensions)]
input_files.sort()

if len(input_files) == 0:
    print("No WhatsApp Images found.")
    exit(1)

print(f"Found {len(input_files)} screenshots.")

def draw_gradient(draw, width, height, color1, color2):
    # Simple vertical gradient
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

def create_shadow(size, radius=30, offset=(0, 20), color=(0, 0, 0, 150)):
    shadow = Image.new('RGBA', size, (0,0,0,0))
    draw = ImageDraw.Draw(shadow)
    # Draw rounded rect
    draw.rounded_rectangle([(0,0), size], radius=radius, fill=color)
    shadow = shadow.filter(ImageFilter.GaussianBlur(25))
    return shadow

for i, filename in enumerate(input_files):
    if i >= len(captions):
        break
        
    print(f"Processing {filename}...")
    
    # 1. Background
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)
    # Gradient from very dark blue/purple to black
    draw_gradient(draw, W, H, (20, 24, 38), (5, 6, 8))
    
    # Add subtle geometric accents
    draw.ellipse((-300, -300, 500, 500), fill=(30, 35, 55))
    draw.ellipse((W-400, H-200, W+400, H+600), fill=(25, 20, 45))
    # Blur background to smooth out shapes
    img = img.filter(ImageFilter.GaussianBlur(80))
    draw = ImageDraw.Draw(img) # Re-init draw after blur
    
    # 2. Text
    title, subtitle = captions[i]
    try:
        font_title = ImageFont.truetype(font_path, 110)
        font_sub = ImageFont.truetype(font_path, 65)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
    
    # Calculate text widths to center (Pillow >= 10 uses textbbox)
    bbox_t = draw.textbbox((0,0), title, font=font_title)
    tw = bbox_t[2] - bbox_t[0]
    bbox_s = draw.textbbox((0,0), subtitle, font=font_sub)
    sw = bbox_s[2] - bbox_s[0]
    
    # Draw Title
    draw.text(((W - tw)/2, 200), title, font=font_title, fill=(255, 255, 255))
    # Draw Subtitle
    draw.text(((W - sw)/2, 340), subtitle, font=font_sub, fill=(180, 190, 220))
    
    # 3. Phone Frame & Screenshot
    ss = Image.open(os.path.join(INPUT_DIR, filename)).convert("RGBA")
    
    # Target SS size (leave padding)
    ss_w = 950
    ss_h = int(ss.size[1] * (ss_w / ss.size[0]))
    ss = ss.resize((ss_w, ss_h), Image.Resampling.LANCZOS)
    
    # Phone Bezel parameters
    padding = 30
    radius = 50
    bezel_w = ss_w + (padding * 2)
    bezel_h = ss_h + (padding * 2)
    
    bezel_x = int((W - bezel_w) / 2)
    bezel_y = 520
    
    # Draw shadow
    shadow_img = create_shadow((bezel_w, bezel_h), radius=radius+10)
    img.paste(shadow_img, (bezel_x, bezel_y + 30), shadow_img)
    
    # Draw Bezel
    bezel = Image.new('RGBA', (bezel_w, bezel_h), (0,0,0,0))
    bezel_draw = ImageDraw.Draw(bezel)
    # Outer frame (silver/dark grey)
    bezel_draw.rounded_rectangle([(0,0), (bezel_w, bezel_h)], radius=radius, fill=(35, 38, 48))
    # Inner frame (black)
    bezel_draw.rounded_rectangle([(padding-5, padding-5), (bezel_w - padding + 5, bezel_h - padding + 5)], radius=radius-10, fill=(0,0,0))
    
    # Paste screenshot inside bezel
    # To get rounded corners on SS, we create a mask
    mask = Image.new('L', (ss_w, ss_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0,0), (ss_w, ss_h)], radius=radius-15, fill=255)
    
    bezel.paste(ss, (padding, padding), mask)
    
    # Add a dynamic island / notch
    island_w, island_h = 240, 65
    island_x = int((bezel_w - island_w) / 2)
    island_y = padding + 15
    bezel_draw.rounded_rectangle([(island_x, island_y), (island_x + island_w, island_y + island_h)], radius=32, fill=(15, 15, 15))
    
    # Paste full bezel on main image
    img.paste(bezel, (bezel_x, bezel_y), bezel)
    
    # Save
    out_path = os.path.join(OUTPUT_DIR, f"screenshot_{i+1}.jpg")
    img.convert('RGB').save(out_path, quality=95)

print("All screenshots generated successfully in assets/play_store_screens/")
