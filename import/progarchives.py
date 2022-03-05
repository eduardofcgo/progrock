import logging
from datetime import datetime
from urllib3.util.retry import Retry
from urllib import parse
import string

from bs4 import BeautifulSoup
import requests
from requests.adapters import HTTPAdapter
from lxml import html, etree
import sqlite3


base_url = "http://www.progarchives.com/"
artist_list_url = "http://www.progarchives.com/bands-alpha.asp"
artist_url = "http://www.progarchives.com/artist.asp"
albums_table_realeses = ["studio", "live", "video", "compilation", "single"]
album_reviews_url = "http://www.progarchives.com/album-reviews.asp"
album_info_url = "http://www.progarchives.com/updatetitle.asp"


logging.basicConfig(level=logging.DEBUG)

db = sqlite3.connect("../data/progrock.db")

create_tables_script = open("../tables/progarchives.sql")
db.executescript(create_tables_script.read())


def count_saved_artists():
    cursor = db.execute("select count(*) from artist")
    return cursor.fetchone()[0]


def get_image_id(url):
    cursor = db.execute("select id from image where url = ?", (url,))
    row = cursor.fetchone()

    if not row:
        return None
    else:
        return row[0]


def save_image(url):
    if not url:
        return None

    image_id = get_image_id(url)
    if image_id:
        return image_id

    image_bytes, content_type = download_image(url)
    if not image_bytes:
        return None

    db.execute(
        "insert or ignore into image(url, image, content_type) values (?, ?, ?)",
        (url, sqlite3.Binary(image_bytes), content_type),
    )
    image_id = get_image_id(url)

    return image_id


def save_genre(genre_name):
    db.execute("insert or ignore into spotify_genre(name) values (?)", (genre_name,))
    cursor = db.execute("select id from genre where name = ?", (genre_name,))
    genre_id = cursor.fetchone()[0]
    return genre_id


def save_country(country_name):
    db.execute("insert or ignore into country(name) values (?)", (country_name,))
    cursor = db.execute("select id from country where name = ?", (country_name,))
    country_id = cursor.fetchone()[0]
    return country_id


def save_user(user_id):
    db.execute("insert or ignore into user(id) values (?)", (user_id,))
    return user_id


def save_artist(
    artist_id,
    artist_name,
    artist_genre,
    artist_country,
    artist_image_url,
    artist_bio_html,
):
    image_id = save_image(artist_image_url)
    genre_id = save_genre(artist_genre)
    country_id = save_country(artist_country)
    db.execute(
        "insert or ignore into artist(id, name, bio, image_id, genre_id, country_id) values (?, ?, ?, ?, ?, ?)",
        (artist_id, artist_name, artist_bio_html, image_id, genre_id, country_id),
    )


def save_album(
    album_id,
    artist_id,
    album_name,
    album_year,
    album_genre,
    album_image_url,
    album_realese,
    album_info,
    album_tracks,
    album_credits,
):
    image_id = save_image(album_image_url)
    genre_id = save_genre(album_genre)

    db.execute(
        "insert or ignore into album(id, name, year, image_id, artist_id, genre_id, realese, info, tracks, credits) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            album_id,
            album_name,
            album_year,
            image_id,
            artist_id,
            genre_id,
            album_realese,
            album_info,
            album_tracks,
            album_credits,
        ),
    )


def save_rating(number, user_id, album_id, stars):
    user_id = save_user(user_id)
    db.execute(
        "insert or ignore into rating(number, user_id, album_id, stars) values (?, ?, ?, ?)",
        (number, user_id, album_id, stars),
    )


def save_review(created, user_id, album_id, starts, content):
    user_id = save_user(user_id)
    db.execute(
        "insert or ignore into review(created, user_id, album_id, stars, content) values (?, ?, ?, ?, ?)",
        (created, user_id, album_id, starts, content),
    )


def is_scraped(artist_id):
    cursor = db.execute("select id from artist where id = ?", (artist_id,))
    return bool(cursor.fetchone())


retry_status_codes = {522, 500}

session = requests.Session()
retry = Retry(
    total=25,
    backoff_factor=1,
    connect=25,
    read=25,
    status=25,
    other=25,
    raise_on_status=True,
    status_forcelist=retry_status_codes,
)
session.mount(base_url, HTTPAdapter(max_retries=retry))
session.headers.update(
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36"
    }
)


def get(url):
    session.cookies.clear()

    return session.get(url, timeout=10)


def download_page(url):
    page_res = get(url)
    page_res.raise_for_status()
    return html.fromstring(page_res.text)


def download_image(url):
    image_res = get(url)

    if image_res.status_code == 404:
        return None, None
    else:
        image_res.raise_for_status()

    content = image_res.content
    content_type = image_res.headers["Content-Type"]

    return image_res.content, content_type


def get_artist_list_by_letter_url(letter):
    encoded_params = parse.urlencode({"letter": letter})
    return f"{artist_list_url}?{encoded_params}"


def get_album_reviews_url(album_id):
    encoded_params = parse.urlencode({"id": album_id})
    return f"{album_reviews_url}?{encoded_params}"


def get_album_info_url(album_id):
    encoded_params = parse.urlencode({"cd_id": album_id})
    return f"{album_info_url}?{encoded_params}"


def get_url_params(url):
    parsed_url = parse.urlparse(url)
    return parse.parse_qs(parsed_url.query)


def absolute(url):
    return parse.urljoin(base_url, url)


artist_initial_letters = string.ascii_lowercase + "0"

if __name__ == "__main__":

    found_artist_count = 0

    for letter in artist_initial_letters:
        artist_page = download_page(get_artist_list_by_letter_url(letter))
        header, *artist_rows = artist_page.xpath('//*[@id="main"]/div[1]/table//tr')

        found_artist_count += len(artist_rows)

        for artist_row in artist_rows:
            try:

                (artist_url,) = artist_row.xpath(".//a/@href")
                artist_url = absolute(artist_url)

                artist_id = int(get_url_params(artist_url)["id"][0])

                if is_scraped(artist_id):
                    logging.info("Already scraped artist, will skip %s", artist_url)
                    continue

                (artist_genre,) = artist_row.xpath(".//td[2]/span/text()")
                (artist_country,) = artist_row.xpath(".//td[3]/span/text()")

                artist_page = download_page(artist_url)

                (artist_name,) = artist_page.xpath('//*[@id="main"]/div/h1/text()')
                print(artist_name)

                try:
                    (artist_bio_el,) = artist_page.xpath("//span[@id='moreBio'][1]")
                except ValueError:
                    (artist_bio_el,) = artist_page.xpath(
                        "//*[@id='main']/div/div[2]/div[3]/*[2]"
                    )

                artist_bio_el.make_links_absolute(base_url)
                artist_bio_html = etree.tostring(artist_bio_el, pretty_print=True)

                try:
                    (artist_image_url,) = artist_page.xpath(
                        "//*[@id='main']/div/div[2]/div[2]/img/@src"
                    )
                    artist_image_url = absolute(artist_image_url)
                except ValueError:
                    artist_image_url = None

                save_artist(
                    artist_id,
                    artist_name,
                    artist_genre,
                    artist_country,
                    artist_image_url,
                    artist_bio_html,
                )

                albums_tables = artist_page.xpath("//*[@id='main']/div/div[2]/table")

                for albums_table, albums_realese in zip(
                    albums_tables, albums_table_realeses
                ):
                    artist_album_urls = albums_table.xpath(".//strong/../@href")
                    artist_album_years = albums_table.xpath(
                        ".//strong/../../span[@style='color:#777']/text()"
                    )

                    for artist_album_url, artist_album_year in zip(
                        artist_album_urls, artist_album_years
                    ):
                        artist_album_url = absolute(artist_album_url)
                        artist_album_year = int(artist_album_year)

                        album_id = int(get_url_params(artist_album_url)["id"][0])

                        album_page = download_page(artist_album_url)

                        (album_image_url,) = album_page.xpath(
                            "//img[@id='imgCover']/@src"
                        )
                        album_image_url = absolute(album_image_url)

                        (album_name,) = album_page.xpath(
                            "//*[@id='main']/div/h1/text()"
                        )

                        (album_genre,) = album_page.xpath(
                            "//*[@id='main']/div[1]/h2[2]/text()"
                        )

                        album_info_page_url = get_album_info_url(album_id)
                        album_info_page = download_page(album_info_page_url)

                        try:
                            (album_info,) = album_info_page.xpath(
                                "//textarea[@name='Irelinfo']/text()"
                            )
                        except ValueError:
                            album_info = None

                        try:
                            (album_tracks,) = album_info_page.xpath(
                                "//textarea[@name='Itracks']/text()"
                            )
                        except ValueError:
                            album_tracks = None

                        try:
                            (album_credits,) = album_info_page.xpath(
                                "//textarea[@name='Icredits']/text()"
                            )
                        except ValueError:
                            album_credits = None

                        save_album(
                            album_id,
                            artist_id,
                            album_name,
                            artist_album_year,
                            album_genre,
                            album_image_url,
                            albums_realese,
                            album_info,
                            album_tracks,
                            album_credits,
                        )

                        reviews_url = get_album_reviews_url(album_id)
                        reviews_page = download_page(reviews_url)

                        review_els = reviews_page.xpath(
                            "//div[@style='margin:0px 10px 20px 0px;background-color:#f0f0f0;padding:5px 5px 10px 0px;']"
                        )
                        for review_el in review_els:
                            try:
                                (review_user_url,) = review_el.xpath(
                                    ".//div[@class='avatar-box']/a[1]/@href"
                                )
                                (review_user_id,) = get_url_params(review_user_url)[
                                    "id"
                                ]
                            except ValueError:
                                (review_user_id,) = review_el.xpath(
                                    ".//div[@class='avatar-box']//span[1]/@title"
                                )

                            review_stars = int(
                                review_el.xpath(".//img[@border='0']/@alt")[0].split(
                                    " "
                                )[0]
                            )

                            review_date_text = (
                                review_el.xpath(".//font/text()")[2]
                                .split("Posted ")[1]
                                .split(" |")[0]
                            )
                            review_date = datetime.strptime(
                                review_date_text, "%A, %B %d, %Y"
                            )

                            review_content = review_el.xpath("./div[2]")[0]
                            review_content_soup = BeautifulSoup(
                                html.tostring(review_content), features="lxml"
                            )

                            review_report_el = review_content_soup.find_all("div")[-1]
                            review_report_el.decompose()

                            review_text = review_content_soup.get_text()

                            save_review(
                                review_date,
                                review_user_id,
                                album_id,
                                review_stars,
                                review_text,
                            )

                        rating_els = reviews_page.xpath(
                            "//*[@id='main']/div[2]/div[2]/ul//li"
                        )
                        for number, rating_el in enumerate(rating_els):
                            try:
                                (review_user_url,) = rating_el.xpath("./a/@href")
                                (review_user_id,) = get_url_params(review_user_url)[
                                    "id"
                                ]
                            except ValueError:
                                (review_user_id,) = rating_el.xpath(
                                    "./strong/span/@title"
                                )

                            rating_stars = int(
                                rating_el.xpath("./img/@alt")[0].split(" ")[0]
                            )

                            save_rating(number, review_user_id, album_id, rating_stars)

                logging.info("Finished scraping artist %s", artist_url)
                db.commit()

            except ValueError as e:
                db.rollback()
                logging.exception(e)

    logging.info(
        "Saved %d artists out of %d found", count_saved_artists(), found_artist_count
    )
