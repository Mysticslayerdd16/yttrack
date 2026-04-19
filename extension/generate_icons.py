#!/usr/bin/env python3
# Run this to generate placeholder icons if needed
# pip install Pillow --break-system-packages
try:
    from PIL import Image, ImageDraw
    for size in [16, 48, 128]:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle([0, 0, size-1, size-1], radius=size//5, fill=(232, 74, 58, 255))
        # Draw play triangle
        m = size // 4
        pts = [(m, m), (m, size-m), (size-m, size//2)]
        draw.polygon(pts, fill=(255, 255, 255, 255))
        img.save(f'icon{size}.png')
    print("Icons generated!")
except ImportError:
    print("Pillow not installed. Add your own icon PNG files named icon16.png, icon48.png, icon128.png")
