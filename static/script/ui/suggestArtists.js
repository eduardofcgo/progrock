;(async function () {
  function fetchSearchResults(query) {
    const url = '/card/suggest/search?query=' + encodeURIComponent(query)
    return fetchOk(url).then(res => res.text())
  }

  function fetchSuggestedArtist(artistId) {
    return fetchOk('/card/suggest/suggested?id=' + artistId)
      .then(res => res.text())
      .then(text => {
        const suggestedEl = document.createElement('div')
        suggestedEl.classList.add('user-suggested-artist')
        suggestedEl.innerHTML = text

        return suggestedEl
      })
  }

  function setUpOnSuggest(app, artistId, searchResultsNode) {
    const suggestButtons = searchResultsNode.querySelectorAll('.artist-suggest')

    suggestButtons.forEach(button => {
      const suggestedArtistId = Number(button.dataset.artist)

      button.onclick = function () {
        button.disabled = true
        button.innerHTML = 'Suggesting...'

        app
          .suggestArtist(artistId, suggestedArtistId)
          .then(() => {
            button.innerHTML = 'Suggested'
          })
          .catch(err => {
            console.error(err)

            alert('Unexpected error')
          })
      }
    })
  }

  const form = document.getElementById('suggest-search-form')
  const searchResultsNode = document.getElementById('suggest-search-results')
  const userSuggestedNode = document.getElementById('user-suggested')

  const artistId = form.dataset.artist

  const app = await requireApp()
  await app.accountReady()

  app.registerOnUserSuggestedUpdate(artistId, suggestions => {
    userSuggestedNode.innerHTML = null

    suggestions.forEach(suggestedArtistId => {
      fetchSuggestedArtist(suggestedArtistId).then(node => {
        const unsugestIcon = node.querySelector('.icon')

        unsugestIcon.onclick = function () {
          app.unsugestArtist(artistId, suggestedArtistId).catch(err => {
            console.error(err)

            alert('Unexpected error')
          })
        }

        userSuggestedNode.appendChild(node)
      })
    })
  })

  form.onsubmit = function (e) {
    e.preventDefault()

    const query = document.getElementById('suggest-search-query').value

    const searchResults = fetchSearchResults(query)
      .then(results => {
        searchResultsNode.innerHTML = results
        setUpOnSuggest(app, artistId, searchResultsNode)
      })
      .catch(err => {
        console.error(err)

        searchResultsNode.innerHTML = 'Unexpected error'
      })

    return false
  }
})()
