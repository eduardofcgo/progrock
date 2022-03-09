import sqlite3

import pandas as pd
from surprise import reader, accuracy, Dataset, model_selection, KNNBaseline
import numpy as np

progrock = sqlite3.connect("../data/progrock.db")

query = """
  select user_id, album.artist_id, sum(stars) as sstars
  from (
    select user_id, album_id, stars from (
      select rating.user_id, rating.album_id, rating.stars from rating union
      select review.user_id, review.album_id, review.stars from review
    )
  )
  left join album on album.id = album_id
  where album.artist_id not in (select artist_id from banned_artist)
  group by user_id, album.artist_id
  having sstars > 0
  order by album.artist_id
"""

data = pd.read_sql_query(query, progrock)

reader = reader.Reader(rating_scale=(1, 1407))
dataset = Dataset.load_from_df(data, reader=reader)

# train, test = model_selection.train_test_split(dataset, test_size=0.25)
train = dataset.build_full_trainset()

sim_options = {"name": "pearson_baseline", "min_support": 5, "user_based": False}
algo = KNNBaseline(sim_options=sim_options)
algo.fit(train)

# predictions = algo.test(test)
# accuracy.rmse(predictions)

sim_matrix = algo.compute_similarities()
np.save("sims", sim_matrix, allow_pickle=False)

ids = np.array([train.to_raw_iid(item) for item in train.all_items()])
np.save("ids", ids, allow_pickle=False)
