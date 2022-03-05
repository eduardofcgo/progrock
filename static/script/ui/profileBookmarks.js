;(async function () {
  function fetchBookmarkCard(artistId) {
    const fetchUrl = '/card/bookmark?id=' + artistId

    return fetchOk(fetchUrl).then(res => res.text())
  }

  function setUpBookmarkMenu(node, favoriteArtists, artistId) {
    const favoriteIcon = node.querySelector('.favorite-artist')
    const unbookmarkIcon = node.querySelector('.bookmark-artist')

    const isFavorite = () => favoriteArtists.includes(artistId)

    const markFavorite = () => {
      favoriteIcon.classList.remove('favorite-icon')
      favoriteIcon.classList.add('favorite-icon-filled')
    }

    const markNotFavorite = () => {
      favoriteIcon.classList.remove('favorite-icon-filled')
      favoriteIcon.classList.add('favorite-icon')
    }

    if (isFavorite()) {
      markFavorite()
      favoriteIcon.style.visibility = 'unset'
    }

    favoriteIcon.onclick = function () {
      if (isFavorite())
        app.unfavoriteArtist(artistId).then(() => {
          markNotFavorite()

          favoriteArtists.pop(artistId)
        })
      else
        app.favoriteArtist(artistId).then(() => {
          markFavorite()

          favoriteArtists.push(artistId)
        })
    }

    const removeBookmarkNode = () => {
      setTimeout(() => {
        node.parentNode.removeChild(node)
      }, 500)
    }

    unbookmarkIcon.onclick = function () {
      unbookmarkIcon.classList.remove('bookmark-icon-filled')
      unbookmarkIcon.classList.add('bookmark-icon')

      app
        .unbookmarkArtist(artistId)
        .then(removeBookmarkNode)
        .catch(err => {
          console.error(err)

          alert('Unexpected error')
        })
    }
  }

  function populateBookmarks(savedArtists) {
    bookmarksNode.innerHTML = null

    savedArtists.bookmarks.forEach(artistId => {
      fetchBookmarkCard(artistId)
        .then(bookmarkHTML => {
          const bookmarkNode = document.createElement('div')
          bookmarkNode.classList.add('recommendation')
          bookmarkNode.innerHTML = bookmarkHTML

          setUpBookmarkMenu(bookmarkNode, savedArtists.favorites, artistId)

          bookmarksNode.appendChild(bookmarkNode)
        })
        .catch(err => {
          console.error(err)
        })
    })
  }

  const bookmarksNode = document.getElementById('bookmarks')

  const app = await requireApp()
  await app.accountReady()

  const savedArtists = await app.getUserSavedArtists()

  populateBookmarks(savedArtists)
})()
