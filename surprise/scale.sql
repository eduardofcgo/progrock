select user_id, album.artist_id, sum(stars) as sstars
from (
  select user_id, album_id, stars from (
    select rating.user_id, rating.album_id, rating.stars from rating union
    select review.user_id, review.album_id, review.stars from review
  )
)
left join album on album.id = album_id
group by user_id, album.artist_id
order by sstars desc
limit 1
