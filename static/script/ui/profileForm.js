;(async function () {
  const validatedUserMessage = 'You are signed in with email'
  const anonymousUserMessage = 'To login or register, add your email'
  const submitFeedbackMessage = 'Confirmation email sent to your inbox'
  const submittingButton = 'Submitting...'
  const sentButton = 'Sent'

  const form = document.getElementById('account-details')
  const submitFeedback = document.getElementById('account-details-submit-feedback')
  const userStateMessage = document.getElementById('user-state-message')
  const emailInput = document.getElementById('account-email')
  const emailInputDefaultPlaceholder = emailInput.placeholder
  const saveButton = document.getElementById('account-save')
  const signoutButton = document.getElementById('account-signout')
  const bookmarksNode = document.getElementById('bookmarks')
  const favoritesNode = document.getElementById('favorites')

  const app = await requireApp()
  const user = await app.accountReady()

  function signedInForm() {
    userStateMessage.innerHTML = validatedUserMessage
    emailInput.placeholder = user.email
    signoutButton.style.display = 'unset'
    signoutButton.disabled = false
    emailInput.disabled = true
    saveButton.disabled = true
    saveButton.style.display = 'none'

    signoutButton.onclick = function (e) {
      e.preventDefault()

      signoutButton.disabled = true

      app
        .signOut()
        .then(() => {
          bookmarksNode.innerHTML = null
          favoritesNode.innerHTML = null

          signedOutForm()
        })
        .catch(err => {
          signoutButton.disabled = false

          console.error(err)
          alert('Unexpected error')
        })

      return false
    }
  }

  function signedOutForm() {
    userStateMessage.innerHTML = anonymousUserMessage
    emailInput.placeholder = 'Your email'
    signoutButton.style.display = 'none'
    emailInput.disabled = false
    saveButton.disabled = false
    saveButton.style.display = 'unset'

    form.onsubmit = function (e) {
      e.preventDefault()

      saveButton.disabled = true
      submitFeedback.innerHTML = null

      app
        .sendConfirmationEmail(emailInput.value)
        .then(() => {
          submitFeedback.innerHTML = submitFeedbackMessage
          saveButton.value = sentButton
        })
        .catch(err => {
          console.error(err)
          alert('Unexpected error')
        })

      return false
    }
  }

  if (user.emailVerified) signedInForm()
  else signedOutForm()
})()
