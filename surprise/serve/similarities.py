import numpy as np


def get_for_multiple_artists(sims_matrix, inner_ids):
    artist_similarities = []

    for inner_id in inner_ids:
        similarities = sims_matrix[inner_id]

        artist_similarities.append(similarities)

    return np.sum(artist_similarities, axis=0)
