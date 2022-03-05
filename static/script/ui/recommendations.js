;(async function () {
  function removeArtistRecommendation(artistId) {
    const nodes = document.querySelectorAll('.recommendation-artist-' + artistId)

    nodes.forEach(node => {
      node.parentNode.removeChild(node)
    })
  }

  function fetchSuggestions(artistId) {
    const url = '/card/recommendations/suggested?id=' + artistId
    return fetchOk(url)
      .then(res => res.text())
      .then(suggestionsHTML => {
        const node = document.createElement('div')
        node.innerHTML = suggestionsHTML

        return node
      })
  }

  function addUserSuggestion(recommendations, artistId) {
    fetchSuggestions(artistId).then(suggestions => {
      Array.from(suggestions.children).forEach(suggestion => {
        recommendations.prepend(suggestion)
      })
    })
  }

  function filterRecommendations() {
    const artistHeader = document.getElementById('artist-header')
    const recommendationArtistId = Number(artistHeader.dataset.artist)

    app.getNegativeVotedArtists(recommendationArtistId).then(votedNegative => {
      votedNegative.forEach(removeArtistRecommendation)
    })
  }

  function addUserSuggestions() {
    const artistHeader = document.getElementById('artist-header')
    const recommendations = document.getElementById('recommendations')
    const isShowingArtistRecommendations = recommendations.classList.contains(
      'artist-recommendations'
    )

    if (isShowingArtistRecommendations) {
      const recommendationArtistId = Number(artistHeader.dataset.artist)

      app.registerOnUserSuggestedUpdate(recommendationArtistId, userSuggestions => {
        userSuggestions.forEach(suggestion => {
          addUserSuggestion(recommendations, suggestion)
        })
      })
    }
  }

  const app = await requireApp()
  await app.accountReady()

  addUserSuggestions()
  filterRecommendations()
})()
