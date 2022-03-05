;(async function () {
  const saveMenu = document.querySelectorAll('.artist-save-menu-buttons')

  const app = await requireApp()
  await app.accountReady()

  saveMenu.forEach(saveMenuNode => {
    const saveMenuLoadingContainer = saveMenuNode.parentNode
    const favoriteNode = saveMenuNode.querySelector('.favorite-artist')
    const bookmarkNode = saveMenuNode.querySelector('.bookmark-artist')

    const artistId = Number(saveMenuNode.dataset.artist)

    app.registerOnSavedArtistsUpdate(savedArtists => {
      saveMenuLoadingContainer.style.visibility = 'unset'

      const favories = savedArtists.favorites
      const bookmarks = savedArtists.bookmarks

      if (favories.includes(artistId)) {
        favoriteNode.classList.remove('favorite-icon')
        favoriteNode.classList.add('favorite-icon-filled')
      } else {
        favoriteNode.classList.remove('favorite-icon-filled')
        favoriteNode.classList.add('favorite-icon')
      }

      if (bookmarks.includes(artistId)) {
        bookmarkNode.classList.remove('bookmark-icon')
        bookmarkNode.classList.add('bookmark-icon-filled')
      } else {
        bookmarkNode.classList.remove('bookmark-icon-filled')
        bookmarkNode.classList.add('bookmark-icon')
      }
    })

    favoriteNode.onclick = function () {
      if (favoriteNode.classList.contains('favorite-icon')) {
        var res = app.favoriteArtist(artistId)
      } else {
        var res = app.unfavoriteArtist(artistId)
      }

      res.catch(err => {
        console.error(err)

        alert('Unexpected Error')
      })
    }

    bookmarkNode.onclick = function () {
      if (bookmarkNode.classList.contains('bookmark-icon')) {
        var res = app.bookmarkArtist(artistId)
      } else {
        var res = app.unbookmarkArtist(artistId)
      }

      res.catch(err => {
        console.error(err)

        alert('Unexpected Error')
      })
    }
  })
})()
