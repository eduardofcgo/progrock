import io
import sqlite3

from PIL import Image
from PIL import ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True


max_size = 240


def create_thumbnail(image, destination):
    image = Image.open(image)

    width, height = image.size

    if width > height:
        max_height = max_size
        max_width = width
    else:
        max_width = max_size
        max_height = height

    image.thumbnail((max_width, max_height))

    image = image.convert("RGB")

    image.save(destination, "JPEG", optimize=True)


progrock = sqlite3.connect("../data/progrock.db")

progrock.executescript(
    """
		drop table if exists thumbnail;
		create table thumbnail(
			image_id int primary key,
			thumbnail blob not null,
			content_type string not null
		);
	"""
)

cur = progrock.cursor()

for image_id, image_blob in progrock.execute("select id, image from image"):
    image = io.BytesIO(image_blob)
    thumbnail = io.BytesIO()

    create_thumbnail(image, thumbnail)

    thumbnail_bytes = thumbnail.getvalue()
    content_type = "image/jpg"

    cur.execute(
        "insert into thumbnail values(?, ?, ?)",
        (image_id, thumbnail_bytes, content_type),
    )


progrock.commit()
progrock.executescript("vacuum;")

progrock.close()
