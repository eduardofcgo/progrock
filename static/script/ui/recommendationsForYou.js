;(async function () {
  const surpriseService = 'https://europe-west1-progrock.cloudfunctions.net/surprise'
  const minimumLoadingTimeMs = 1500

  function fetchRecommendationCard(artistId) {
    const fetchUrl = '/card/me/artist?id=' + artistId

    return fetchOk(fetchUrl).then(res => res.text())
  }

  function fetchSurpriseRecommendations(artistIds) {
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

  const recommendations = document.getElementById('recommendations')
  const panelMessage = recommendations.querySelector('.panel-message')

  const profilePageUrl = '/profile'

  const app = await requireApp()
  await app.accountReady()

  const { favorites } = await app.getUserSavedArtists()

  if (favorites.length === 0) {
    panelMessage.innerHTML = 'You have not added favorites to your profile.'
  } else {
    try {
      const surpriseRecommendations = await fetchSurpriseRecommendations(favorites)

      const filteredRecommendations = filterRecommendations(
        surpriseRecommendations,
        favorites
      )

      await new Promise(resolve => setTimeout(resolve, minimumLoadingTimeMs))

      recommendations.innerHTML = null

      filteredRecommendations.forEach(({ artist_id, score }) => {
        fetchRecommendationCard(artist_id).then(recommendationHTML => {
          const recommendationCard = createRecommendationCard(recommendationHTML)

          recommendations.appendChild(recommendationCard)
        })
      })
    } catch (err) {
      console.error(err)

      alert('Unexpected Error')
    }
  }
})()
