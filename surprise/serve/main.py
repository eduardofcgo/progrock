import os
import io
from operator import itemgetter

import numpy as np

import requests
from flask import jsonify

from similarities import get_for_multiple_artists


sims_url = os.getenv(
    "SIMS_URL", default="https://storage.googleapis.com/progdataset/sims.npy"
)
ids_url = os.getenv(
    "IDS_URL", default="https://storage.googleapis.com/progdataset/ids.npy"
)


def download_np(url):
    r = requests.get(url, stream=True)
    return np.load(io.BytesIO(r.raw.read()))


def index_ids(ids_artist):
    index = {}

    for inner_id, artist_id in enumerate(ids_artist):
        index[int(artist_id)] = inner_id

    return index


ids_artist = download_np(ids_url)
sims_matrix = download_np(sims_url)
artist_ids = index_ids(ids_artist)


def get_sims(artists):
    artist_inner_ids = [artist_ids[artist_id] for artist_id in artists]
    similarities = get_for_multiple_artists(sims_matrix, artist_inner_ids)

    sims = [
        (int(ids_artist[inner_id]), sim) for inner_id, sim in enumerate(similarities)
    ]

    sims.sort(key=itemgetter(1), reverse=True)
    top_sims = sims[:100]

    return [{"artist_id": artist_id, "score": sim} for artist_id, sim in top_sims]


def surprise(request):
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }

        return "", 204, headers

    headers = {"Access-Control-Allow-Origin": "*"}

    artist_ids = map(int, request.args.getlist("artist_id"))
    body = jsonify(get_sims(artist_ids))

    return body, 200, headers
