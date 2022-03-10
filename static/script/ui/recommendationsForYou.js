;(async function () {
  const surpriseService = 'https://europe-west1-progrock.cloudfunctions.net/surprise'
  const optimizingMessage = `<div class="panel-message light-text">Optimizing...</div>`
  const noFavoritesMessage = `<div class="panel-message light-text">You have not added favorites to your profile</div>`
  const minimumLoadingTimeMs = 1500
  const addFavoriteSleepMs = 500

  function fetchRecommendationCard(artistId) {
    const fetchUrl = '/card/me/artist?id=' + artistId

    return fetchOk(fetchUrl).then(res => res.text())
  }

  function fetchSurpriseRecommendations(artistIds) {
    artistIds.sort()

    const fetchUrl =
      surpriseService + '?' + artistIds.map(artistId => `artist_id=${artistId}`).join('&')
    const fetchOptions = {
      mode: 'cors',
    }

    return fetchOk(fetchUrl, fetchOptions).then(res => {
      return res.json()
    })
  }

  function filterRecommendations(recommendations, favorites) {
    const withoutFavorites = recommendations.filter(({ artist_id }) => {
      return !favorites.includes(artist_id)
    })

    const topRecommendations = withoutFavorites.slice(0, 20)

    return topRecommendations
  }

  function createRecommendationCard(recommendationHTML) {
    const el = document.createElement('div')

    el.classList.add('recommendation')
    el.innerHTML = recommendationHTML

    return el
  }

  function optimize() {
    recommendationsMessage.style.display = "none"
    recommendations.innerHTML = optimizingMessage
  }

  function setUpFavorite(node, artistId) {
    const icon = node.querySelector('.favorite-artist')

    icon.onclick = function () {
      icon.classList.remove('favorite-icon')
      icon.classList.add('favorite-icon-filled')

      app
        .favoriteArtist(artistId)
        .then(() => {
          favorites.push(artistId)

          return sleep(addFavoriteSleepMs)
        })
        .then(() => {
          optimize()

          return loadSurpriseRecommendations()
        })
        .catch(err => {
          console.error(err)

          alert('Unexpected error')
        })
    }
  }

  async function loadSurpriseRecommendations() {
    const surpriseRecommendations = await fetchSurpriseRecommendations(favorites)

    const filteredRecommendations = filterRecommendations(
      surpriseRecommendations,
      favorites
    )

    await sleep(minimumLoadingTimeMs)

    recommendations.innerHTML = null
    recommendationsMessage.style.display = "block"

    filteredRecommendations.forEach(({ artist_id, score }) => {
      fetchRecommendationCard(artist_id).then(recommendationHTML => {
        const recommendationCard = createRecommendationCard(recommendationHTML)

        setUpFavorite(recommendationCard, artist_id)
        recommendations.appendChild(recommendationCard)
      })
    })
  }

  const recommendations = document.getElementById('recommendations')
  const recommendationsMessage = document.getElementById('recommendations-message')

  const app = await requireApp()
  await app.accountReady()

  const { favorites } = await app.getUserSavedArtists()

  if (favorites.length === 0) {
    recommendations.innerHTML = noFavoritesMessage
  } else {
    try {
      await loadSurpriseRecommendations()
    } catch (err) {
      console.error(err)

      alert('Unexpected Error')
    }
  }
})()
