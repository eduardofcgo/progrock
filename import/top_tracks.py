import sys
import logging
import sqlite3
import json


import spotipy
from spotipy.oauth2 import SpotifyOAuth


sp = spotipy.Spotify(auth_manager=SpotifyOAuth())


def save_results(spotify_artist_id, results):
    cur = spotify.cursor()
    cur.execute(
        "insert into track_results(spotify_artist_id, results) values (?, ?)",
        (spotify_artist_id, json.dumps(results, indent=4)),
    )


def has_saved_results(spotify_artist_id):
    cur = spotify.cursor()
    cur.execute(
        "select * from track_results where spotify_artist_id = (?)",
        (spotify_artist_id,),
    )
    return cur.fetchone() is not None


def save_spotify_track(_id, album_id, preview_url, popularity, name):
    cur = progrock.cursor()
    cur.execute(
        """
        insert or ignore into spotify_track(id, album_id, preview_url, popularity, name)
        values (?, ?, ?, ?, ?)
    """,
        (_id, album_id, preview_url, popularity, name),
    )


def add_track_to_top_track(artist_id, track_id):
    cur = progrock.cursor()
    cur.execute(
        "insert or ignore into spotify_top_track(artist_id, track_id) values (?, ?)",
        (artist_id, track_id),
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


progrock = sqlite3.connect("../data/progrock.db")

spotify = sqlite3.connect("../data/spotify.db")
spotify.executescript(
    """
        create table if not exists track_results(
            spotify_artist_id string primary key,
            results string not null
        );
    """
)


for artist_id, spotify_artist_id in progrock.execute(
    """
    select artist_id, spotify_artist_id
    from artist_spotify_match_score
    where spotify_artist_id is not null
    order by artist_id
"""
):
    if has_saved_results(spotify_artist_id):
        print("Already downloaded", spotify_artist_id)
        continue

    result = sp.artist_top_tracks(spotify_artist_id)
    tracks = result["tracks"]

    save_results(spotify_artist_id, tracks)

    spotify.commit()

    print("Downloaded", artist_id, spotify_artist_id)


print("Download finished")

spotify.executescript("vacuum;")


for spotify_artist_id, results in spotify.execute(
    "select spotify_artist_id, results from track_results"
):
    tracks = json.loads(results)

    for track in tracks:
        album = track["album"]
        album_id = album["id"]
        track_id = track["id"]

        save_spotify_track(
            track_id, album_id, track["preview_url"], track["popularity"], track["name"]
        )
        add_track_to_top_track(spotify_artist_id, track_id)

        for image in album["images"]:
            save_spotify_image(image["url"], image["height"], image["width"])
            add_image_to_album(album_id, image["url"])


progrock.commit()

progrock.executescript("vacuum;")

print("Import finished")

spotify.close()
progrock.close()
