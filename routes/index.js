var routes = function(app){
  var r = require('koa-router')()
  var path = require('path')
  var fs = require('fs')
  var swaggerJSDoc = require('swagger-jsdoc')
  var config = require(app.rootDir + '/lib/config')

  r.get('/', function*(next){
    return this.body =
    { active: true
    , timestamp: new Date().getTime()
    }
  })

  function getDirectories(pathname) {
    return fs.readdirSync(pathname).filter(function(file){
      return fs.statSync(path.join(pathname, file)).isDirectory()
    })
  }

  var directories = getDirectories(__dirname)

  directories.forEach(function(dir){
    var paths = require('./' + dir)(app)
    for (var method in paths) {
      for (var path in paths[method]) {
        var callback = paths[method][path]
        var dirPath = __dirname
        var version = dirPath.split('/').pop()
        var uri = '/' + dir + path
        if (Array.isArray(callback)) {
          callback.unshift(uri)
          r[method.toLowerCase()].apply(r, callback)
        } else {
          r[method.toLowerCase()](uri, callback)
        }
      }
    }
  })

  /**
   *
   */
  var isUnixHiddenPath = function(path) {
    return (/(^|\/)\.[^\/\.]/g).test(path);
  }

  var walk = function(dir, exclusions, parent) {
    var results = []
    if(parent) {
      dir = parent + '/' + dir
    }

    var excludedFileTypes =
    [ 'md'
    , 'json'
    , 'sql'
    , 'log'
    ]

    var files = fs.readdirSync(dir)
    for(var idx in files) {
      var con = true
      var file = files[idx]
      try {
        var f = fs.lstatSync(dir + '/' + file)
        if(isUnixHiddenPath(file)) {
          throw new Error('hidden file')
        }
        if(excludedFileTypes.indexOf(file.split('.')[file.split.length - 1]) !== -1) {
          throw new Error('unsupported type')
        }
        if(exclusions.indexOf(dir + '/' + file) > -1) {
          throw new Error('excluded file')
        }
      } catch(e) {
        con = false
      }
      if(exclusions.indexOf(dir) !== -1) {
        con = false
      }
      if(con) {
        if(f.isDirectory()) {
          results = results.concat(walk(file, exclusions, dir))
        } else {
          results.push(dir + '/' + file)
        }
      }
    }
    return results
  }

  var specs = walk
    ( app.rootDir
    , [ app.rootDir + '/db'
      , app.rootDir + '/node_modules'
      , app.rootDir + '/public'
      , app.rootDir + '/gulp'
      , app.rootDir + '/gulpfile.js'
      , app.rootDir + '/migrations'
      ]
    );

  console.log('specs:', specs)

  var swaggerOptions = {
    swaggerDefinition: {
      swagger: '2.0',
      info: {
        title: 'API Explorer', // Title (required)
        version: '1.0.0', // Version (required)
        contact: {
          name: '',
          url: ''
        },
      },
      host: config.app.domain + ':' + config.app.port,
      basePath: config.app.namespace
    },
    apis: specs, // Path to the API docs
  };

  // Initialize swagger-jsdoc -> returns validated swagger spec in json format
  var swaggerSpec = swaggerJSDoc(swaggerOptions);

  r.get('/docs.json', function*(next) {
    console.log('swagger spec: ', swaggerSpec)
    this.body = swaggerSpec
  });


  return r
}

module.exports = routes
