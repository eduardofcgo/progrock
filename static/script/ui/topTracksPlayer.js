;(function () {
  const defaultVolume = 0.7

  const players = document.querySelectorAll('.artist-track-player')
  const volumeSlider = document.getElementById('track-volume-slider')

  const playingClass = 'artist-track-control-playing'
  const pausedClass = 'artist-track-control-paused'

  const pausePlayers = exceptPlayer => {
    const playersToPause = Array.from(players).filter(p => p != exceptPlayer)
    const playersLoading = playersToPause.map(p => p.loading)

    return Promise.all(playersLoading).then(() => {
      playersToPause.forEach(p => p.pause())
    })
  }

  const setPlayIcon = controlButton => {
    const classList = controlButton.classList

    classList.remove(pausedClass)
    classList.add(playingClass)
  }

  const setPauseIcon = controlButton => {
    const classList = controlButton.classList

    classList.remove(playingClass)
    classList.add(pausedClass)
  }

  const startRotatingAlbum = albumImage => {
    albumImage.classList.add('artist-track-image-playing')
  }

  const stopRotatingAlbum = albumImage => {
    albumImage.classList.remove('artist-track-image-playing')
  }

  const persistVolume = volume => {
    window.localStorage.setItem('volume', volume)
  }

  const getPersistedVolume = () => {
    return window.localStorage.getItem('volume')
  }

  const setVolume = volume => {
    volumeSlider.value = volume * 100

    players.forEach(player => {
      player.volume = volume
    })
  }

  const setInitialVolume = () => {
    const volume = getPersistedVolume() || defaultVolume

    setVolume(volume)
  }

  const hideVolumeSlider = () => {
    volumeSlider.style.display = 'none'
  }

  const showVolumeSlider = () => {
    volumeSlider.style.display = 'unset'
  }

  if (volumeSlider) {
    setInitialVolume()

    volumeSlider.onchange = function () {
      const volume = this.value / 100

      persistVolume(volume)
      setVolume(volume)
    }
  }

  document.querySelectorAll('.artist-track').forEach(trackNode => {
    const player = trackNode.lastElementChild
    const controlButton = trackNode.querySelector('.artist-track-control')
    const albumImage = trackNode.querySelector('.artist-track-image')

    trackNode.onclick = function () {
      if (player.paused) {
        player.currentTime = 0
        player.loading = player.play() || Promise.resolve()

        showVolumeSlider()
        pausePlayers(player)
      } else {
        hideVolumeSlider()
        pausePlayers()
      }
    }

    player.onplay = function () {
      setPlayIcon(controlButton)

      player.loading.then(() => {
        startRotatingAlbum(albumImage)
      })
    }

    player.onpause = function () {
      setPauseIcon(controlButton)
      stopRotatingAlbum(albumImage)
    }
  })
})()
