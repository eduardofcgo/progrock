from operator import itemgetter
import sqlite3

import pandas as pd
from surprise import reader, accuracy, Dataset, model_selection, SVD


query = """
  select
    matching_artist_id,
    artist_id,
    1.0 * nmatches * nmatches * nmatches * nmatches / nreviews / nreviews / nreviews
  from artist_nmatches;
"""

con = sqlite3.connect("../../data/progrock.db")

data = pd.read_sql_query(query, con)

reader = reader.Reader(rating_scale=(0, 1943))
dataset = Dataset.load_from_df(data, reader=reader)

train, test = model_selection.train_test_split(dataset, test_size=0.25)
# train = dataset.build_full_trainset()

algo = SVD()

algo.fit(train)

predictions = algo.test(test)
accuracy.rmse(predictions)


def predict(matching_artist):
    predictions = []

    for (artist_id,) in con.execute("select id from artist"):
        prediction = algo.predict(matching_artist, artist_id)
        predictions.append((artist_id, prediction.est))

    predictions.sort(key=itemgetter(1), reverse=True)

    return predictions
