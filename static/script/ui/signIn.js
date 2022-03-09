;(async function () {
  const signInMessage = document.getElementById('signin-message')
  const profilePageUrl = '/profile'

  const app = await requireApp()
  await app.accountReady()

  const currentUrl = window.location.href

  const confirmEmailHandler = resolve => {
    const confirmedEmail = window.prompt('Confirm your email')

    resolve(confirmedEmail)
  }

  if (app.isUserFollowingEmailValidationLink(currentUrl)) {
    try {
      await app.signInEmail(currentUrl, confirmEmailHandler)

      window.location.replace(profilePageUrl)
    } catch (err) {
      if (err.code === 'auth/invalid-action-code')
        signInMessage.innerHTML = 'Invalid login link'
      else if (err.code === 'auth/expired-action-code')
        signInMessage.innerHTML = 'Expired login link'
      else {
        signInMessage.innerHTML = 'Unexpected error'

        console.error(err)
      }
    }
  } else {
    signInMessage.innerHTML = 'Not following signin link'

    throw new Error('Not following signin link', { url: currentUrl })
  }
})()
