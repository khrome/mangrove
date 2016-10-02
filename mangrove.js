(function (root, factory) {
    var clientReadFile = function(request){
        return function(name, cb){
            request(name, function(err, req, data){
                cb(err, data);
            });
        };
    };
    if (typeof define === 'function' && define.amd) {
        define([
            'indexed-set', 
            'sift', 
            'where-parser', 
            'browser-request'
        ], function(a, b, c, request){
            return factory(a, b, c, {readFile:clientReadFileGenerator(request)});
        });
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(
            require('indexed-set'), 
            require('sift'), 
            require('where-parser'),
            require('fs')
        );
    }else{
        root.returnExports = factory(
            root.IndexedSet, 
            root.Sift, 
            root.WhereParser,
            {readFile:clientReadFileGenerator(root.request)}
        );
    }
}(this, function(Indexed, Sift, WhereParser, fs){
    
    var jobs = [];
    var active = 0;
    var whereParser = new WhereParser();
    
    function computeSetWhere(set, where){
        var results = set;
        var fullSet = results.clone();
        var previousConjunction;
        where.forEach(function(part, whereIndex){
            if(Array.isArray(part)){
                //support subenvironments through recursive call with clone
            }else{
                switch(part.type){
                    case 'expression':
                        if(previousConjunction){
                            if(!results[previousConjunction.value]){
                                throw new Error(
                                    'conjunction not supported: '+
                                    previousConjunction.value
                                );
                            }
                            results = results.clone();
                            var predicate = fullSet.clone().with(part.key, part.operator, part.value);
                            results[previousConjunction.value](predicate);
                            previousConjunction = undefined;
                        }else{
                            results = results.clone();
                            results.with(
                                part.key, 
                                part.operator, 
                                part.value
                            );
                        }
                        break;
                    case 'conjunction':
                        previousConjunction = part;
                        break;
                }
            }
        });
        return results;
    }
    
    function ready(cb){
        if((!jobs) || active === 0) return cb();
        else return jobs.push(cb);
    }
    
    function completed(){
        active--;
        if(active === 0){
            var actions = jobs;
            jobs = false;
            actions.forEach(function(cb){
                cb();
            })
        }
    }
    
    function DataService(options){
        this.options = options || {};
        this.tables = {};
        var ob = this;
        if(this.options.file){
            active++;
            fs.readFile(this.options.file, function(err, body){
                var data = JSON.parse(body);
                if(data){
                    Object.keys(data).forEach(function(collectionName){
                        ob.tables[collectionName] = new Indexed.Collection(
                            data[collectionName], 
                            'id'
                        );
                    });
                    completed();
                }
            });
        }
        //options.file
        //options.lazy
    }
    
    DataService.prototype.collection = function(name){
        if(!this.tables[name]) throw new Error('unknown collection: '+name);
        return this.tables[name];
    }
    
    DataService.prototype.query = function(query, callback){
        switch(typeof query){
            case 'string':
                this.sql(query, callback);
                break;
            case 'object':
                this.sift(query, callback);
                break;
        }
    }
    
    DataService.prototype.sift = function(query, callback){
        throw new Error('not yet supported')
    }
    
    DataService.prototype.sql = function(query, callback){
        var ob = this;
        ready(function(){
            var match;
            match = query.match(/select (.*) from (.*) where (.*)/i)
            if(match){
                var returns = match[1];
                var collections = match[2].split(',');
                var collection = ob.collection(collections[0]);
                var where = whereParser.parse(match[3]);
                //todo: handle specific returns
                var results = computeSetWhere(new Indexed.Set(collection), where);
                if(collections.length > 1) throw new Exception('multi-collection selection unavailable');
                callback(undefined, results);
            }else{
                //if there's no complex selection, let's test a simple one
                match = query.match(/select (.*) from (.*)/i)
                if(match){
                    var returns = match[1];
                    var collections = match[2].split(',');
                    if(collections.length > 1) throw new Exception('multi-collection selection unavailable');
                    var collection = ob.collection(collections[0]);
                    if(returns == '*') callback(undefined, new Indexed.Set(collection));
                }
            }
            match = query.match(/insert into (.*) \((.*)\) values \((.*)\)/i)
            if(match){
                var collections = match[1].split(',').map(function(str){ return str.trim()});
                if(collections.length > 1) throw new Exception('you can only insert into a single collection');
                var collection = ob.collection(collections[0]);
                if(!collection) throw new Exception('collection not found: '+collections[0]);
                var columns = match[2].split(',').map(function(str){ return str.trim()});
                var valuesSets = match[3].split(/\) *, *\(/).map(function(set){
                    return eval('['+set+']'); //yes, this is crazy dangerous and needs to be replaced by a parser
                });
                
                var fullSet = new Indexed.Set(collection)
                
                valuesSets.forEach(function(set){
                    var newItem = {};
                    columns.forEach(function(columnName, index){
                        newItem[columnName] = set[index];
                    });
                    fullSet.push(newItem);
                });
                
                callback(undefined);
            }else{
                match = query.match(/insert into (.*) values (.*)/i)
                if(match){
                    throw new Error('you must define column names in order to insert. While defining by column order is legal SQL, it would be ambiguous given the arbitrary object insertion and the lack of consistent ordering in js objects. Manually defining a field order may be supported in the future in order to work around this. File a bug!');
                }
            }
            match = query.match(/update (.*) set (.*) where (.*)/i)
            if(match){
                console.log('update')
            }
            match = query.match(/delete (.*) from (.*) where (.*)/i)
            if(match){
                console.log('delete')
            }
            match = query.match(/create (.*)/)
            if(match){
                console.log('delete')
            }
        });
    }
    
    DataService.prototype.inquire = function(query){ //promise-based
        var ob = this;
        var promise = new Promise(function(resolve, reject){
            ob.query(query, function(err, results){
                if(err) return reject(err);
                else return resolve(results);
            });
        });
        return promise;
    }
    return DataService;
}));