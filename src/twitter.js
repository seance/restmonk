var restify = require('restify'),
    qs = require('querystring'),
    client = restify.createJsonClient({
      url: 'https://api.twitter.com',
    })

var apiKey = process.env.TWITTER_API_KEY,
    apiSecret = process.env.TWITTER_API_SECRET,
    consumerCreds = new Buffer(apiKey + ":" + apiSecret).toString('base64'),
    bearerToken = null

function basicAuthHeaders() {
  return { 'Authorization': 'Basic ' + consumerCreds }
}

function bearerAuthHeaders() {
  return { 'Authorization': 'Bearer ' + bearerToken }
}

function fetchBearerToken(opts) {
  console.log('fetchBearerToken')
  client.post({
      path: '/oauth2/token',
      headers: basicAuthHeaders()
    },
    {
      grant_type: 'client_credentials'
    },
    function(err, req, res, obj) {
      if (!err) {
        console.log('fetchBearerToken succeeded: ' + obj.access_token
        bearerToken = obj.access_token
        // schedule removing token in 15 mins?
        opts.onSuccess()
      } else {
        console.log('fetchBearerToken failed: ' + err, req, res)
        opts.onError(err)
      }
    })
}

function get(path, opts) {
  function getWithToken() {
    console.log('getWithToken: ' + bearerToken)
    client.get({
      path: path,
      headers: bearerAuthHeaders()
    }, function(err, req, res, obj) {
      if (!err) {
        console.log('getWithToken succeeded')
        opts.onSuccess(req, res, obj)
      } else {
        // remove bearerToken if necessary?
        console.log('getWithToken failed: ' + err, req, res)
        opts.onError(err)
      }
    })
  }
  if (bearerToken) {
    getWithToken()
  } else {
    fetchBearerToken({
      onSuccess: getWithToken,
      onError: opts.onError
    })
  }
}

exports.getLatestTweet = function(screenName, opts) {
  console.log('getLatestTweet: ' + screenName)
  get('/statuses/user_timeline?' + qs.stringify({
    screen_name: screenName,
    count: 1
  }), {
    onSuccess: function(req, res, obj) {
      opts.onSuccess(obj[0].text)
    },
    onError: opts.onError
  })
}
