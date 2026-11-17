import os
from PIL import Image, ImageDraw, ImageFont

def create_app_icon(size):
    # Create RGBA canvas
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    corner_radius = int(size * 0.22)
    bg_color = (15, 23, 42, 255) # slate-900 #0f172a
    border_color = (56, 189, 248, 255) # sky-400 #38bdf8
    
    # Outer background
    draw.rounded_rectangle([(2, 2), (size - 3, size - 3)], radius=corner_radius, fill=bg_color, outline=border_color, width=max(2, int(size * 0.03)))

    # Inner gradient/accent badge
    badge_margin = int(size * 0.18)
    badge_rect = [(badge_margin, badge_margin), (size - badge_margin, size - badge_margin)]
    draw.rounded_rectangle(badge_rect, radius=int(size * 0.12), fill=(14, 165, 233, 220)) # #0ea5e9

    # Draw stylized calculator / currency symbol: "%" and "₽"
    # Draw a line and circles for %
    cx, cy = size // 2, size // 2
    r_dot = max(2, int(size * 0.06))
    
    # Slanted division slash
    draw.line([(cx + int(size * 0.12), cy - int(size * 0.14)), (cx - int(size * 0.12), cy + int(size * 0.14))], fill=(255, 255, 255, 255), width=max(2, int(size * 0.045)))
    
    # Upper left dot
    draw.ellipse([(cx - int(size * 0.13) - r_dot, cy - int(size * 0.09) - r_dot), 
                  (cx - int(size * 0.13) + r_dot, cy - int(size * 0.09) + r_dot)], fill=(255, 255, 255, 255))
    
    # Lower right dot
    draw.ellipse([(cx + int(size * 0.13) - r_dot, cy + int(size * 0.09) - r_dot), 
                  (cx + int(size * 0.13) + r_dot, cy + int(size * 0.09) + r_dot)], fill=(255, 255, 255, 255))

    return img

def main():
    os.makedirs('www', exist_ok=True)
    icon192 = create_app_icon(192)
    icon192.save('www/icon-192.png', 'PNG')
    
    icon512 = create_app_icon(512)
    icon512.save('www/icon-512.png', 'PNG')
    print("Generated www icons (192 and 512)")

    # Android mipmaps
    res_base = 'android/app/src/main/res'
    mipmap_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }

    for folder, sz in mipmap_sizes.items():
        target_dir = os.path.join(res_base, folder)
        os.makedirs(target_dir, exist_ok=True)
        ico = create_app_icon(sz)
        ico.save(os.path.join(target_dir, 'ic_launcher.png'), 'PNG')
        ico.save(os.path.join(target_dir, 'ic_launcher_round.png'), 'PNG')
        print(f"Generated {folder} icon ({sz}x{sz})")

if __name__ == '__main__':
    main()
