import sys
import logging
import sqlite3
import json


import spotipy
from spotipy.oauth2 import SpotifyOAuth


sp = spotipy.Spotify(auth_manager=SpotifyOAuth())


def nonblank_lines(f):
    for l in f:
        line = l.rstrip()
        if line:
            yield line


def save_results(artist_id, query, results):
    cur = spotify.cursor()
    cur.execute(
        "insert into search_results(artist_id, query, results) values (?, ?, ?)",
        (artist_id, query, json.dumps(results, indent=4)),
    )


def has_saved_results(artist_id):
    cur = spotify.cursor()
    cur.execute("select * from search_results where artist_id = (?)", (artist_id,))
    return cur.fetchone() is not None


def save_spotify_result(artist_id, spotify_artist_id):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_result(artist_id, spotify_artist_id) values (?, ?)",
        (artist_id, spotify_artist_id),
    )


def save_spotify_artist(_id, href, name):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_artist(id, href, name) values (?, ?, ?)",
        (_id, href, name),
    )


def save_spotify_album(_id, artist_id, href, name, release_date):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_album(id, href, name, release_date, artist_id) values (?, ?, ?, ?, ?)",
        (_id, href, name, release_date, artist_id),
    )


def save_spotify_image(url, height, width):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_image(url, height, width) values (?, ?, ?)",
        (url, height, width),
    )


def add_image_to_album(album_id, image_url):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_album_image(spotify_album_id, spotify_image_url) values (?, ?)",
        (album_id, image_url),
    )


def add_album_to_artist(artist_id, album_id):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_artist_album(artist_id, album_id) values (?, ?)",
        (artist_id, album_id),
    )


def save_genre(genre_name):
    cur = progrock.cursor()
    cur.execute("insert or ignore into spotify_genre(name) values (?)", (genre_name,))

    cur = progrock.cursor()
    cur.execute("select id from spotify_genre where name = ?", (genre_name,))
    genre_id = cur.fetchone()[0]

    return genre_id


def add_genre_to_artist(artist_id, genre_id):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_artist_genre(artist_id, genre_id) values (?, ?)",
        (artist_id, genre_id),
    )


def add_genre_as_prog(genre_id):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_prog_genre(genre_id) values (?)", (genre_id,)
    )


progrock = sqlite3.connect("../data/progrock.db")

spotify = sqlite3.connect("../data/spotify.db")
spotify.executescript(
    """
        create table if not exists search_results(
            artist_id int primary key,
            query string not null,
            results string not null
        );
    """
)


for _id, name in progrock.execute("select id, name from artist order by id"):
    if has_saved_results(_id):
        print("Already searched", _id, name)
        continue

    result = sp.search(name, type="artist", limit=10)
    artists = result["artists"]["items"]

    for artist in artists:
        albums = sp.artist_albums(artist["id"], limit=50)

        artist["albums"] = albums["items"]

    save_results(_id, name, artists)

    spotify.commit()

    print("Downloaded", _id, name)


print("Download finished")

spotify.executescript("vacuum;")

progrock.executescript(open("../tables/spotify.sql").read())


for artist_id, query, results_str in spotify.execute(
    "select artist_id, query, results from search_results"
):
    results = json.loads(results_str)

    for artist in results:
        spotify_artist_id = artist["id"]

        save_spotify_artist(spotify_artist_id, artist["href"], artist["name"])
        save_spotify_result(artist_id, spotify_artist_id)

        for genre in artist["genres"]:
            genre_id = save_genre(genre)
            add_genre_to_artist(spotify_artist_id, genre_id)

        for album in artist["albums"]:
            album_id = album["id"]

            save_spotify_album(
                album_id,
                spotify_artist_id,
                album["href"],
                album["name"],
                album["release_date"],
            )

            for image in album["images"]:
                save_spotify_image(image["url"], image["height"], image["width"])
                add_image_to_album(album_id, image["url"])


progrock.commit()

prog_genres = nonblank_lines(open("../data/genres"))

for prog_genre in prog_genres:
    genre_id = save_genre(prog_genre)
    add_genre_as_prog(genre_id)

progrock.commit()

progrock.executescript("vacuum;")

print("Import finished")

spotify.close()
progrock.close()
