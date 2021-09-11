(function (root, factory) {
    var clientReadFileGenerator = function(request){
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
            'strangler',
            'browser-request'
        ], function(a, b, c, request){
            return factory(a, b, c, {readFile:clientReadFileGenerator(request)});
        });
    }else if (typeof module === 'object' && module.exports){
        module.exports = factory(
            require('indexed-set'),
            require('sift'),
            require('where-parser'),
            require('strangler'),
            require('fs')
        );
    }else{
        root.returnExports = factory(
            root.IndexedSet,
            root.Sift,
            root.WhereParser,
            root.Strangler,
            {readFile:clientReadFileGenerator(root.request)}
        );
    }
}(this, function(Indexed, Sift, WhereParser, strings, fs){

    //var jobs = [];
    //var active = 0;
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
                            var predicate = results.with(part.key, part.operator, part.value);
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

    function DataService(options){
        this.options = options || {};
        this.tables = {};
        this.jobs = [];
        this.links = [];
        this.active = 0;
        var ob = this;
        if(this.options.file){
            this.active++;
            fs.readFile(this.options.file, function(err, body){
                var data = JSON.parse(body);
                if(data){
                    Object.keys(data).forEach(function(collectionName){
                        ob.tables[collectionName] = new Indexed.Collection(
                            data[collectionName],
                            'id'
                        );
                    });
                    ob.completed();
                }
            });
        }
        if(this.options.data){
            var data = this.options.data;
            Object.keys(data).forEach(function(collectionName){
                console.log(collectionName, data[collectionName]);
                ob.tables[collectionName] = new Indexed.Collection(
                    data[collectionName],
                    'id'
                );
                console.log(collectionName, (new Indexed.Set(ob.tables[collectionName])).toArray() );
            });
        }
        //options.lazy
    }

    DataService.prototype.ready = function(cb){
        if((!this.jobs) || this.active === 0) return cb();
        else return this.jobs.push(cb);
    }

    DataService.prototype.completed = function(){
        this.active--;
        if(this.active === 0){
            var actions = this.jobs;
            this.jobs = false;
            actions.forEach(function(cb){
                cb();
            })
        }
    }

    DataService.prototype.upstream = function(emitter, opts){
      var options = opts || {};
      var upstreamOp = function(operation, collectionName, query, callback){
        var id = 'todo_switch_to_uuids'+Math.floor(Math.random()*1000000);
        emitter.emit('mangrove-'+operation, {
          id: id,
          name: collectionName,
          query: query
        });
        emitter.once('mangrove-results', {id:{'$eq':id}}, function(response){
          callback(
            (response.err && new Error('Upstream Error: '+response.err)),
            response.results
          );
        });
      };
      //todo: proactively fetch marked collections
      if(options.collections){
        this.links = this.links.concat(options.collections);
      }
      this.upstream = function(collectionName){
        return {
          find : function(query, cb){
            return upstreamOp('find', collectionName, query, cb);
          },
          insert : function(item, cb){
            return upstreamOp('insert', collectionName, item, cb);
          },
          update : function(updates, where, cb){
            return upstreamOp('update', collectionName, {updates, where}, cb);
          },
          'delete' : function(where, cb){
            return upstreamOp('delete', collectionName, where, cb);
          }
        }
      }
      //todo: proactively fetch marked collections
      if(options.collections){
        this.links = this.links.concat(options.collections);
      }
    }

    DataService.prototype.downstream = function(emitter){

      emitter.on('mangrove-find', (command)=>{
        this.collection(command.name).find(command.query, (err, set)=>{
          emitter.emit('mangrove-results', {
            results : set,
            error: (err && err.message),
            id: command.id
          });
        });
      });

      emitter.on('mangrove-update', (command)=>{
        this.collection(command.name).find(command.query.updates, command.query.where, (err, set)=>{
          emitter.emit('mangrove-results', {
            results : set,
            error: (err && err.message),
            id: command.id
          });
        });
      });

      emitter.on('mangrove-delete', (command)=>{
        this.collection(command.name).find(command.query, (err, set)=>{
          emitter.emit('mangrove-results', {
            results : set,
            error: (err && err.message),
            id: command.id
          });
        });
      });

      emitter.on('mangrove-insert', (command)=>{
        //todo: handle more than 1
        this.collection(command.name).insert(command.query, (err, set)=>{
          emitter.emit('mangrove-results', {
            results : set,
            error: (err && err.message),
            id: command.id
          });
        });
      });
    }

    DataService.prototype.populate = function(link, query, cb){
      //todo: actually populate
      //cases:
      // name
      // name + source
      // name + remote
      /*if(
        link.remote ||
        false || //todo: name + source && empty

      ){

      }*/
      cb();
    }

    DataService.prototype.collection = function(name, noError){
        if(!this.tables[name] && !noError){
            console.log(this.tables);
            throw new Error('unknown collection: '+name);
        }
        return this.tables[name];
    }

    DataService.prototype.toJSON = function(formatted){
        var result = {};
        var ob = this
        Object.keys(this.tables).forEach(function(tableName){
            result[tableName] = (new Indexed.Set(ob.tables[tableName])).toArray();
        });
        return !!formatted?JSON.stringify(result):JSON.stringify(result, undefined, '    ');
    }

    DataService.prototype.query = function(query, callback){
        switch(typeof query){
            case 'string':
                if(query.indexOf(' ') === -1 && query.indexOf("\n") === -1){
                    //it's a single world
                    var collection = this.collection(query, true);
                    if(!collection){
                        collection = new Indexed.Collection([], 'id' );
                        this.tables[query] = collection;
                        var link = this.links.find(function(link){
                          return link.name === query.name;
                        });
                        if(link){
                          this.populate(link, query, ()=>{
                            this.query(query, callback);
                          });
                          return;
                        }
                    }
                    var set = new Indexed.Set(collection);
                    return {
                        find : function(query, cb){
                            if(typeof query === 'function' && !cb){
                                return query(undefined, set);
                            }
                            set.sift(query, function(){
                                return cb?cb(undefined, set):undefined;
                            });
                        },
                        update : function(updates, where, cb){
                            set.sift(where, function(){
                                set.forEach(function(item){
                                    Object.keys(updates).forEach(function(key){
                                        item[key] = updates[key];
                                    });
                                });
                                if(cb) cb();
                            });
                        },
                        insert : function(item, cb){
                            if(Array.isArray(item)){
                                item.forEach(function(itm){
                                    set.push(itm);
                                });
                            }else set.push(item);
                            if(cb) cb();
                        },
                        'delete' : function(where, cb){
                            set.sift(where, function(){
                                set.forEach(function(item){
                                    var id = item[set.primaryKey];
                                    var pos = set.ordering.indexOf(id);
                                    if(pos === -1 && !err) err = new Error('Item not found in set:'+id);
                                    collection.index[id] = false;
                                    set.ordering.splice(pos, 1);
                                });
                                if(cb) cb();
                            });
                        }
                    }
                }else this.sql(query, callback);
                break;
        }
    }

    DataService.prototype.sql = function(query, callback){
        var ob = this;
        this.ready(function(){
            var match;
            match = query.match(/select (.*) from (.*) where (.*)/i)
            if(match){
                var returns = match[1];
                var collections = match[2].split(',');
                var collection = ob.collection(collections[0]);
                var where = whereParser.parse(match[3]);
                if(ob.log) ob.log('select', collections, where);
                //todo: handle specific returns
                var results = computeSetWhere(new Indexed.Set(collection), where);
                if(ob.log) ob.log('select-result', results.toArray());
                if(collections.length > 1) throw new Exception('multi-collection selection unavailable');
                callback(undefined, results);
            }else{
                //if there's no complex selection, let's test a simple one
                match = query.match(/select (.*) from (.*)/i)
                if(match){
                    var returns = match[1].trim();
                    var collections = match[2].split(',');
                    if(ob.log) ob.log('select', collections, match[0]);
                    if(collections.length > 1) throw new Exception('multi-collection selection unavailable');
                    var collection = ob.collection(collections[0]);
                    var result = new Indexed.Set(collection);
                    if(ob.log) ob.log('select-result', result.toArray());
                    if(returns == '*'){
                        callback(undefined, result);
                    }else{
                        returns = returns.split(',').map(function(str){return str.trim()});
                        var trimmedSet = [];
                        result.forEach(function(item){
                            var copy = {};
                            returns.forEach(function(ret){
                                if(item[ret] !== undefined) copy[ret] = item[ret];
                            });
                            trimmedSet.push(copy);
                        });
                        trimmedSet.toArray = function(){ return trimmedSet; };
                        callback(undefined, trimmedSet);
                    }
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

                if(ob.log) ob.log('insert', collections, columns, valuesSets);

                var fullSet = new Indexed.Set(collection);
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
                var values = strings.splitHonoringQuotes(match[2], ',').map(function(str){
                    var clean = str.trim();
                    var pos = clean.indexOf('=');
                    var field = clean.substring(0, pos).trim();
                    var value = eval(clean.substring(pos+1).trim());
                    return {
                        name : field,
                        value : value
                    };
                });
                var collections = match[1].split(',');
                var collection = ob.collection(collections[0]);
                var where = whereParser.parse(match[3]);
                if(ob.log) ob.log('update', collections, values, where);
                //todo: handle specific returns
                var results = computeSetWhere(new Indexed.Set(collection), where);
                if(collections.length > 1) throw new Exception('multi-collection updates not supported');

                results.forEach(function(item, index){
                    values.forEach(function(set){
                        item[set.name] = typeof set.value == 'function'?set.value(item):set.value;
                    });
                });

                callback(undefined);
            }
            match = query.match(/delete from (.*) where (.*)/i)
            if(match){
                var collections = match[1].split(',');
                var collection = ob.collection(collections[0]);
                var where = whereParser.parse(match[2]);
                var err;
                if(ob.log) ob.log('delete', collections, where);
                var results = computeSetWhere(new Indexed.Set(collection), where);
                var deleting = results.toArray();
                results.forEach(function(item){
                    var id = item[results.primaryKey];
                    var pos = results.ordering.indexOf(id);
                    if(pos === -1 && !err) err = new Error('Item not found in set:'+id);
                    collection.index[id] = false;
                    results.ordering.splice(pos, 1);
                });
                if(ob.log) ob.log('delete-results', deleting, results.ordering, results.root.index);
                if(err) return callback(err);
                callback(undefined);
            }
            match = query.match(/create (.*)/)
            if(match){
                var collections = match[1].split(',');
                if(ob.log) ob.log('create', collections, where);
                var collectionObject = new Indexed.Collection([], 'id' );
                ob.tables[collections[0]] = collectionObject;
                if(callback) callback(undefined);
            }
            return Error('no matches found!');
        });
    }

    DataService.prototype.inquire = function(query){ //promise-based
        //todo: support mongo query documents through this interface
        var ob = this;
        if(query.indexOf(' ') === -1 && query.indexOf("\n") === -1){
            var cbInterface = this.query(query);
            return {
                find : function(document){
                    var promise = new Promise(function(resolve, reject){
                        cbInterface.find(document, function(err, results){
                            if(err) return reject(err);
                            else return resolve(results);
                        });
                    });
                    return promise;
                },
                update : function(updates, where){
                    var promise = new Promise(function(resolve, reject){
                        cbInterface.find(updates, where, function(err, results){
                            if(err) return reject(err);
                            else return resolve(results);
                        });
                    });
                    return promise;
                },
                insert : function(item){
                    var promise = new Promise(function(resolve, reject){
                        cbInterface.insert(item, function(err, results){
                            if(err) return reject(err);
                            else return resolve(results);
                        });
                    });
                    return promise;
                },
                'delete' : function(where){
                    var promise = new Promise(function(resolve, reject){
                        cbInterface.delete(where, function(err, results){
                            if(err) return reject(err);
                            else return resolve(results);
                        });
                    });
                    return promise;
                }
            }
        }else{
            var promise = new Promise(function(resolve, reject){
                ob.query(query, function(err, results){
                    if(err) return reject(err);
                    else return resolve(results);
                });
            });
            return promise;
        }
    }
    return DataService;
}));
