from collections import Counter

import spotipy
from spotipy.oauth2 import SpotifyOAuth


scope = "user-library-read"

sp = spotipy.Spotify(
    auth_manager=SpotifyOAuth(
        scope=scope,
    )
)

playlist = sp.playlist(prog_playlist_id)

genres = Counter()
downloaded_artists = set()

for item in playlist["tracks"]["items"]:
    for artist in item["track"]["album"]["artists"]:
        artist_id = artist["id"]

        if artist_id not in downloaded_artists:
            artist = sp.artist(artist_id)

            genres.update(artist["genres"])
            downloaded_artists.add(artist_id)


genres_file = open("../data/genres", "w")
major_genres_file = open("../data/major_genres", "w")

for genre in sorted(genres):
    genres_file.write(genre)
    genres_file.write("\n")

for major_genre in sorted(dict(genres.most_common(7))):
    major_genres_file.write(major_genre)
    major_genres_file.write("\n")

genres_file.close()
major_genres_file.close()
