import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js'
import {
  getAuth,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js'
import {
  getFirestore,
  collection,
  doc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js'

import { AccountManager } from './account.js'
import { Migrator } from './migrator.js'

class App {
  constructor(firebaseConfig, signInRedirectUrl) {
    initializeApp(firebaseConfig)

    this._auth = getAuth()
    this._db = getFirestore()

    this._feedbackCollection = collection(this._db, 'feedback')
    this._artistFeedbackCollection = collection(this._db, 'artist_feedback')
    this._suggestionsCollection = collection(this._db, 'suggestions')

    const migrator = new Migrator(this)
    this._account_manager = new AccountManager(migrator, signInRedirectUrl, this._auth)
  }

  _defaultSignIn() {
    return this._account_manager.signInAnonymously()
  }

  accountReady() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this._auth, user => {
        if (user) resolve(user)
      })

      this._defaultSignIn().catch(reject)
    })
  }

  sendConfirmationEmail(email) {
    return this._account_manager.sendConfirmationEmail(email)
  }

  signInEmail(confirmUrl, confirmEmailHandler) {
    return this._account_manager.signInEmail(confirmUrl, confirmEmailHandler)
  }

  signOut() {
    return this._account_manager.signOut().then(() => {
      return this.accountReady()
    })
  }

  currentUser() {
    if (!this._auth.currentUser) throw new Error('Not signedIn')

    return this._auth.currentUser
  }

  _userSavedArtistsRef() {
    return doc(this._db, 'user_saved_artist', this.currentUser().uid)
  }

  isUserFollowingEmailValidationLink(url) {
    return this._account_manager.isSignInWithEmailLink(url)
  }

  submitArtistFeedback(artist, recommendationArtist, isPositive) {
    const voteType = isPositive ? 'positive' : 'negative'

    return setDoc(
      doc(this._artistFeedbackCollection, String(recommendationArtist)),
      {
        [artist]: {
          [voteType]: arrayUnion(this.currentUser().uid),
        },
      },
      { merge: true }
    )
  }

  submitFeedback(artist, feedbackScore) {
    return setDoc(doc(this._feedbackCollection, artist), {
      [feedbackScore]: arrayUnion(this.currentUser().uid),
    })
  }

  _ensureValidSavedArtists(savedArtists) {
    const ensureArrays = saved => {
      saved.favorites = saved.favorites || []
      saved.bookmarks = saved.bookmarks || []

      return saved
    }

    return ensureArrays(savedArtists || {})
  }

  registerOnSavedArtistsUpdate(sink) {
    onSnapshot(this._userSavedArtistsRef(), doc => {
      const savedArtists = doc.data()

      sink(this._ensureValidSavedArtists(savedArtists))
    })
  }

  suggestArtist(artistId, suggestedArtistId) {
    return setDoc(
      doc(this._suggestionsCollection, String(artistId)),
      {
        [suggestedArtistId]: arrayUnion(this.currentUser().uid),
      },
      { merge: true }
    )
  }

  unsugestArtist(artistId, suggestedArtistId) {
    return setDoc(
      doc(this._suggestionsCollection, String(artistId)),
      {
        [suggestedArtistId]: arrayRemove(this.currentUser().uid),
      },
      { merge: true }
    )
  }

  registerOnUserSuggestedUpdate(artistId, sink) {
    const suggestionsRef = doc(this._suggestionsCollection, String(artistId))

    onSnapshot(suggestionsRef, doc => {
      const suggestions = doc.data() || {}
      const userSuggestions = []

      Object.entries(suggestions).forEach(([artistSuggestionId, usersSuggested]) => {
        if (usersSuggested.includes(this.currentUser().uid))
          userSuggestions.push(artistSuggestionId)
      })

      sink(userSuggestions.sort())
    })
  }

  getUserSavedArtists() {
    return getDoc(this._userSavedArtistsRef()).then(doc => {
      const savedArtists = doc.data()

      return this._ensureValidSavedArtists(savedArtists)
    })
  }

  _ensureValidArtistVotes(votes) {
    const ensureArrays = votes => {
      votes.negative = votes.negative || []
      votes.positive = votes.positive || []

      return votes
    }

    return ensureArrays(votes || {})
  }

  getArtistVotes(artist) {
    return getDoc(doc(this._artistFeedbackCollection, String(artist))).then(doc => {
      const votes = doc.data()

      return votes || {}
    })
  }

  getNegativeVotedArtists(artist) {
    const userVotedNegative = votes => {
      const user = this.currentUser()
      return votes.negative.includes(user.uid)
    }

    return this.getArtistVotes(artist).then(artistsVotes => {
      const votedNegativeArtists = []

      Object.entries(artistsVotes).forEach(([artistId, votes]) => {
        if (userVotedNegative(this._ensureValidArtistVotes(votes)))
          votedNegativeArtists.push(artistId)
      })

      return votedNegativeArtists
    })
  }

  favoriteArtist(artist) {
    return setDoc(
      this._userSavedArtistsRef(),
      {
        favorites: arrayUnion(artist),
      },
      { merge: true }
    )
  }

  unfavoriteArtist(artist) {
    return setDoc(
      this._userSavedArtistsRef(),
      {
        favorites: arrayRemove(artist),
      },
      { merge: true }
    )
  }

  bookmarkArtist(artist) {
    return setDoc(
      this._userSavedArtistsRef(),
      {
        bookmarks: arrayUnion(artist),
      },
      { merge: true }
    )
  }

  unbookmarkArtist(artist) {
    return setDoc(
      this._userSavedArtistsRef(),
      {
        bookmarks: arrayRemove(artist),
      },
      { merge: true }
    )
  }
}

export { App }
