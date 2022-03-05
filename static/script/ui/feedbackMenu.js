;(async function createSuggestionFeedbackMenu(node) {
  const confirmPositive = `
    <div>
      <div class="feedback-confirm-message">Good recommendation?</div>
      <div class="feedback-confirm-options">
        <div class="feedback-icon feedback-positive-icon feedback-submit"></div>
        <div class="feedback-cancel">Cancel</div>
      </div>
    </div>
  `

  const confirmNegative = `
    <div>
      <div class="feedback-confirm-message">Bad recommendation?</div>
      <div class="feedback-confirm-options">
        <div class="feedback-icon feedback-negative-icon feedback-submit"></div>
        <div class="feedback-cancel">Cancel</div>
      </div>
    </div>
  `

  const loading = `
    <div>Submitting...</div>
  `

  const feedbackThanks = `
    <div>Thank you. We will improve our results</div>
  `

  const app = await requireApp()

  const nodes = node.querySelectorAll('.feedback-icon')

  nodes.forEach(feedbackNode => {
    const menu = feedbackNode.parentNode
    menu.style.visibility = 'unset'

    const askFeedbackState = menu.innerHTML

    if (feedbackNode.classList.contains('feedback-positive-icon')) {
      feedbackNode.onclick = function () {
        menu.innerHTML = confirmPositive

        setUpConfirmMenu(true)
      }
    } else {
      feedbackNode.onclick = function () {
        menu.innerHTML = confirmNegative

        setUpConfirmMenu(false)
      }
    }

    const reset = () => {
      menu.innerHTML = askFeedbackState
      menu.classList.remove('feedback-confirm')
      createSuggestionFeedbackMenu(menu)
    }

    const setLoading = () => {
      menu.innerHTML = loading
    }

    const removeRecommendation = artist => {
      setTimeout(() => {
        const recommendation = document.querySelector('.recommendation-artist-' + artist)

        recommendation.parentNode.removeChild(recommendation)
      }, 2000)
    }

    async function submit(isPositive) {
      setLoading()

      await app.accountReady()

      const album = parseInt(menu.dataset.album)
      const artist = parseInt(menu.dataset.artist)
      const recommendationArtist = parseInt(menu.dataset.recommendationArtist)

      try {
        if (album) await app.submitAlbumFeedback(album, recommendationArtist, isPositive)
        else await app.submitArtistFeedback(artist, recommendationArtist, isPositive)

        menu.innerHTML = feedbackThanks

        if (!isPositive) removeRecommendation(artist)
      } catch (err) {
        console.error(err)

        reset()
        alert('Error submitting feedback')
      }
    }

    const setUpConfirmMenu = isPositive => {
      const cancelNode = menu.querySelector('.feedback-cancel')
      const submitNode = menu.querySelector('.feedback-submit')

      menu.classList.add('feedback-confirm')

      cancelNode.onclick = function () {
        reset()
      }
      submitNode.onclick = function () {
        submit(isPositive)
      }
    }
  })
})(document)
