import {
  signInAnonymously,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  linkWithCredential,
  signInWithEmailLink,
  EmailAuthProvider,
} from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js'

class AccountManager {
  constructor(migrator, signInRedirectUrl, auth) {
    this._migrator = migrator
    this._signInRedirectUrl = signInRedirectUrl
    this._auth = auth
  }

  _disableAnonymousLogin() {
    window.localStorage.setItem('disabledAnonymousLogin', 'true')
  }

  _enableAnonymousLogin() {
    window.localStorage.removeItem('disabledAnonymousLogin')
  }

  _isAnonymousLoginDisabled() {
    return window.localStorage.getItem('disabledAnonymousLogin') === 'true'
  }

  _persistEmail(email) {
    window.localStorage.setItem('emailForSignIn', email)
  }

  _getPersistedEmail() {
    return window.localStorage.getItem('emailForSignIn')
  }

  _removePersistedEmail() {
    window.localStorage.removeItem('emailForSignIn')
  }

  signInAnonymously() {
    if (this._isAnonymousLoginDisabled()) return Promise.resolve()
    else return signInAnonymously(this._auth)
  }

  sendConfirmationEmail(email) {
    const actionCodeSettings = {
      url: this._signInRedirectUrl,
      handleCodeInApp: true,
    }

    return sendSignInLinkToEmail(this._auth, email, actionCodeSettings).then(() => {
      this._persistEmail(email)
    })
  }

  _confirmEmail(notFoundHandler) {
    const email = this._getPersistedEmail()

    if (email) return Promise.resolve(email)
    else return new Promise(notFoundHandler)
  }

  async _handleExistingAccountSignin(email, confirmUrl) {
    const migration = await this._migrator.createMigration(this._auth.currentUser)

    const newCredentials = await signInWithEmailLink(this._auth, email, confirmUrl)

    try {
      await migration.migrateToCurrentUser()
    } catch (e) {
      console.error(e)
    }

    return newCredentials
  }

  async signInEmail(confirmUrl, confirmEmailHandler) {
    if (!this._auth.currentUser)
      throw new Error('Must be logged into anonymous account first')

    const email = await this._confirmEmail(confirmEmailHandler)
    const credentials = EmailAuthProvider.credentialWithLink(email, confirmUrl)

    try {
      var newCredentials = await linkWithCredential(this._auth.currentUser, credentials)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        var newCredentials = await this._handleExistingAccountSignin(email, confirmUrl)
      } else if (err.code === 'auth/provider-already-linked') {
        var newCredentials = credentials
      } else throw error
    }

    this._disableAnonymousLogin()

    return newCredentials
  }

  signOut() {
    return signOut(this._auth).then(() => {
      this._removePersistedEmail()
      this._enableAnonymousLogin()
    })
  }

  isSignInWithEmailLink(url) {
    return isSignInWithEmailLink(this._auth, url)
  }
}

export { AccountManager }
