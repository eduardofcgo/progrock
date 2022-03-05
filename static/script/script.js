function fetchOk(url) {
  return fetch(url).then(res => {
    if (res.status !== 200) throw new Error('Non 200 status code', { respose: res, url })

    return res
  })
}

function forEach(fn) {
  return Array.from(this).forEach(fn)
}

NodeList.prototype.forEach = forEach
HTMLCollection.prototype.forEach = forEach

requireApp = async function () {
  const { App } = await import('/static/script/app.js')

  return new App(firebaseConfig, signInRedirectUrl)
}
