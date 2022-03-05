;(async function () {
  const feedbackInput = document.querySelector('.feedback-input')

  const suggestFeedbackStep2 = document.getElementById('suggest-box-step2')
  const suggestBoxMenu = document.getElementById('suggest-box-menu')

  const feedbackPositive = document.getElementById('feedback-positive')
  const feedbackNeutral = document.getElementById('feedback-neutral')
  const feedbackNegative = document.getElementById('feedback-negative')

  async function submitFeedback(artist, feedback) {
    const setLoading = () => {
      feedbackPositive.classList.add('disabled')
      feedbackNeutral.classList.add('disabled')
      feedbackNegative.classList.add('disabled')
    }

    const goToStepTwo = () => {
      suggestBoxMenu.style.display = 'none'
      suggestFeedbackStep2.style.display = 'unset'
    }

    setLoading()

    const app = await requireApp()
    await app.accountReady()

    try {
      await app.submitFeedback(artist, feedback)
      goToStepTwo()
    } catch (err) {
      console.error(err)

      alert('Unexpected error')
    }
  }

  if (suggestFeedbackStep2) {
    const artist = feedbackInput.dataset.recommendationArtist

    feedbackPositive.onclick = function () {
      submitFeedback(artist, 1)
    }

    feedbackNeutral.onclick = function () {
      submitFeedback(artist, 0)
    }

    feedbackNegative.onclick = function () {
      submitFeedback(artist, -1)
    }
  }
})()
