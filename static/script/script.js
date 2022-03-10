function fetchOk(url, options) {
  return fetch(url, options).then(res => {
    if (res.status !== 200) {
      throw new Error(`${res.status} status code`)
    }

    return res
  })
}

function forEach(fn) {
  return Array.from(this).forEach(fn)
}

NodeList.prototype.forEach = forEach
HTMLCollection.prototype.forEach = forEach

const sleep = timeMs => new Promise(resolve => setTimeout(resolve, timeMs))

requireApp = async function () {
  const { App } = await import('/static/script/app.js')

  return new App(firebaseConfig, signInRedirectUrl)
}
