var express = require('express');
var bodyParser = require('body-parser');
var Indexed = require('indexed-set');
var Mangrove = require('./mangrove.js');
var util = require('./util.js');
var pkg = require('./package.json');

//setup io encoder
const PAYLOAD = util.payload;
PAYLOAD.defaultMode = 'json';

var error = function(res, description, code){
    console.log(description);
    res.end(PAYLOAD.stringify({
        error : true,
        message : description
    }));
};

var log = function(str){
    console.log(str);
};

var config = function(cb){
    setTimeout(function(){
        cb(null, module.exports.config)
    }, 0);
}

//TODO: ResultSet Abstraction

module.exports = function(opts, instance){
    var config = config;
    var app = instance || express();
    app.use(bodyParser.json({strict:false}));
    var mangrove = new Mangrove([]);
    app.mangrove = mangrove;

    if(opts.debug) app.get('/admin/load/testdata.json', function(){
        var ob = this;
        fs.readFile('testdata.json', function(err, buffer){
            if(err) return error(err, this.req, this.res);
            var data = PAYLOAD.parse(buffer.toString());
            Object.keys(data).forEach(function(key){
                mangrove.tables[key] = new Indexed.Collection(data[key], 'id');
            });
            ob.res.end(PAYLOAD.stringify({loaded: true, data: data}));
        });
    });

    app.get('/stats/config.json', function(){
        var ob = this;
        config(function(err, config){
            ob.res.end(JSON.stringify({ //always JSON
                version : pkg.version,
                transport : config.transport
            }));
        })
    });

    app.get('/query', function(){ error(this, 'Queries require POST requests') });
    app.post('/query', function(req, res){
        var query = req.body; //SQL
        var fnName = typeof query === 'string'?'query':'inquire';
        var ob = this;
        try{
            var queryError = mangrove[fnName](query, function(err, results){
                if(err) return error(err, req, res);
                if(results) res.end(PAYLOAD.stringify(results.toArray()));
                else res.end(PAYLOAD.stringify({ success : true }));
            });
            if(queryError) return error(this, queryError);
        }catch(ex){
            return error(res, ex.message);
        }
    });

    return app;
}

module.exports.config = {};
