var restify = require('restify'),
    qs = require('querystring'),
    authClient = restify.createStringClient({
      url: 'https://api.twitter.com'
    }),
    contentClient = restify.createJsonClient({
      url: 'https://api.twitter.com'
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
  authClient.post({
      path: '/oauth2/token',
      headers: basicAuthHeaders()
    },
    {
      grant_type: 'client_credentials'
    },
    function(err, req, res, obj) {
      if (!err) {
        bearerToken = JSON.parse(obj).access_token
        // schedule removing token in 15 mins?
        opts.onSuccess()
      } else {
        opts.onError(err)
      }
    })
}

function get(path, opts) {
  function getWithToken() {
    contentClient.get({
      path: path,
      headers: bearerAuthHeaders()
    }, function(err, req, res, obj) {
      if (!err) {
        opts.onSuccess(req, res, obj)
      } else {
        // remove bearerToken if necessary?
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
  get('/1.1/statuses/user_timeline.json?' + qs.stringify({
    screen_name: screenName,
    count: 1
  }), {
    onSuccess: function(req, res, obj) {
      opts.onSuccess(
        obj[0].retweeted_status
          ? 'RT @' + obj[0].retweeted_status.user.screen_name + ': ' +
                     obj[0].retweeted_status.text
          : obj[0].text
      )
    },
    onError: opts.onError
  })
}
