var restify = require('restify'),
    monk = require('monk')

var server = restify.createServer(),
    db = monk(process.env.MONGODB_URI)

var StringP  = function(p) { return String(p) },
    IntP     = function(p) { return parseInt(p) },
    BooleanP = function(p) { return p.toLowerCase() === "true" }

function typifyQuery(q, tm) {
  for (var p in q) {
    if (tm[p]) {
      q[p] = tm[p](q[p])
    } else {
      delete q[p]
    }
  }
  return q
}

function findByQuery(collection, typemap) {
  return function(req, res, next) {
    db.get(collection)
      .find(typifyQuery(req.query, typemap))
      .success(function(docs) {
        res.send(docs)
        next()
      })
  }
}

server.use(restify.queryParser())

server.get('/things', findByQuery('things', {
  name: StringP,
  age: IntP,
  happy: BooleanP
}))

server.listen(process.env.PORT || 8080, function() {
  console.log('%s listening at %s', server.name, server.url)
})
