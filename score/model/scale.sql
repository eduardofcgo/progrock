select
  matching_artist_id,
  artist_id,
  max(1.0 * nmatches * nmatches * nmatches * nmatches / nreviews / nreviews / nreviews) as rating
from artist_nmatches
order by rating asc limit 1;
