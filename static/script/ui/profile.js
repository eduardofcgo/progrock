;(async function () {
  const noBookmarksMessage = `<div class="panel-message light-text">You have not added any bookmarks</div>`
  const noFavoritesMessage = `<div class="panel-message light-text">You have not added any favorites</div>`

  function fetchBookmarkCard(artistId) {
    const fetchUrl = '/card/bookmark?id=' + artistId

    return fetchOk(fetchUrl).then(res => res.text())
  }

  function fetchFavoriteCard(artistId) {
    const fetchUrl = '/card/favorite?id=' + artistId

    return fetchOk(fetchUrl).then(res => res.text())
  }

  function setUpBookmarkMenu(node, artistId) {
    const unbookmarkIcon = node.querySelector('.bookmark-artist')

    const removeBookmarkNode = () => {
      setTimeout(() => {
        if (node.parentNode.childElementCount == 1)
          bookmarksPanel.innerHTML = noBookmarksMessage
        else node.parentNode.removeChild(node)
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

  function setUpFavoriteMenu(node, artistId) {
    const unfavoriteIcon = node.querySelector('.favorite-artist')

    const removeFavoriteNode = () => {
      setTimeout(() => {
        if (node.parentNode.childElementCount == 1)
          favoritesPanel.innerHTML = noFavoritesMessage
        else node.parentNode.removeChild(node)
      }, 500)
    }

    unfavoriteIcon.onclick = function () {
      unfavoriteIcon.classList.remove('favorite-icon-filled')
      unfavoriteIcon.classList.add('favorite-icon')

      app
        .unfavoriteArtist(artistId)
        .then(removeFavoriteNode)
        .catch(err => {
          console.error(err)

          alert('Unexpected error')
        })
    }
  }

  function populateBookmarks(bookmarks) {
    bookmarksNode.innerHTML = null

    bookmarks.forEach(artistId => {
      fetchBookmarkCard(artistId)
        .then(bookmarkHTML => {
          const bookmarkNode = document.createElement('div')
          bookmarkNode.classList.add('recommendation')
          bookmarkNode.innerHTML = bookmarkHTML

          setUpBookmarkMenu(bookmarkNode, artistId)

          bookmarksNode.appendChild(bookmarkNode)
        })
        .catch(err => {
          console.error(err)
        })
    })
  }

  function populateFavorites(favorites) {
    favoritesNode.innerHTML = null

    favorites.forEach(artistId => {
      fetchFavoriteCard(artistId).then(favoriteHTML => {
        const favoriteNode = document.createElement('div')
        favoriteNode.classList.add('recommendation')
        favoriteNode.innerHTML = favoriteHTML

        setUpFavoriteMenu(favoriteNode, artistId)

        favoritesNode.appendChild(favoriteNode)
      })
    })
  }

  const bookmarksNode = document.getElementById('bookmarks')
  const favoritesNode = document.getElementById('favorites')
  const bookmarksPanel = bookmarksNode.parentNode
  const favoritesPanel = favoritesNode.parentNode

  const app = await requireApp()
  await app.accountReady()

  const { bookmarks, favorites } = await app.getUserSavedArtists()

  if (bookmarks.length) populateBookmarks(bookmarks)
  else bookmarksPanel.innerHTML = noBookmarksMessage

  if (favorites.length) populateFavorites(favorites)
  else favoritesPanel.innerHTML = noFavoritesMessage
})()
