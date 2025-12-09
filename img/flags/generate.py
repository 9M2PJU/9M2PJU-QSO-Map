import os
from datetime import timedelta
from PIL import Image, ImageDraw, ImageFont

from requests_cache import CachedSession

test = os.listdir("./")
for item in test:
    if item.endswith(".png"):
        os.remove(os.path.join("./", item))

cache = CachedSession("/tmp/cache", expire_after=timedelta(days=30))
data = cache.get("https://raw.githubusercontent.com/k0swe/dxcc-json/refs/heads/main/dxcc.json").json()

for dxcc in data["dxcc"]:
    id = dxcc["entityCode"]
    flag = dxcc["flag"]
    image = Image.new("RGBA", (140, 110), (255, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.text((0, -10), flag, font=ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", 109), embedded_color=True)
    outfile = str(id) + ".png"
    image.save(outfile, "PNG")

image = Image.new("RGBA", (140, 110), (255, 0, 0, 0))
image.save("999.png", "PNG")