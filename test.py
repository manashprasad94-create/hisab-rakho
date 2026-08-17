from PIL import Image, ImageDraw, ImageFont

def make_icon(size, path):
    img = Image.new('RGB', (size, size), '#0f766e')
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("arial.ttf", int(size*0.5))  # Windows has arial.ttf by default
    text = "₹"
    bbox = draw.textbbox((0,0), text, font=font)
    w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
    draw.text(((size-w)/2 - bbox[0], (size-h)/2 - bbox[1]), text, fill='white', font=font)
    img.save(path)

make_icon(192, 'public/icon-192.png')
make_icon(512, 'public/icon-512.png')