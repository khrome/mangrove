var should = require("should");
var request = require("request");
var Mangrove = require('./mangrove');

describe('Mangrove', function(){
    
    describe('handles SQL', function(){
        
        var datasource = new Mangrove({file:'testdata.json'});
        
        describe('selects', function(){
        
            it('for a full set', function(done){
                datasource.query(
                    'select * from users', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(6);
                        done();
                    }
                );
            });
            
            it('using a where clause with a bounded selection', function(done){
                datasource.query(
                    'select * from users where age > 24', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(4);
                        done();
                    }
                );
            });
            
            it('using a where clause with a ranged selection', function(done){
                datasource.query(
                    'select * from users where age > 24 and age < 36', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(2);
                        done();
                    }
                );
            });
            
            it('an exact string value', function(done){
                datasource.query(
                    'select * from users where name = "roger"', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(1);
                        done();
                    }
                );
            });
            
            it('specific values for a full set', function(done){
                datasource.query(
                    'select age, name from users', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(6);
                        should.not.exists(results[0].id);
                        done();
                    }
                );
            });
            
        });
        
        describe('inserts', function(){
            
            it('a single value which is then reselectable', function(done){
                datasource.query(
                    'insert into users (name, age, id) values ("sherman", 12, "djfuhf73b327s09")', 
                    function(err){
                        should.not.exist(err);
                        datasource.query(
                            'select * from users where name = "sherman"', 
                            function(err, data){
                                var results = data.toArray();
                                results.length.should.equal(1);
                                done();
                            }
                        );
                    }
                );
            });
            
            it('multiple values which are then reselectable', function(done){
                datasource.query(
                    'insert into users (name, age, id) values ("ivan", 23, "kdsfh7sdy4jhveve"), ("jason", 37, "fsdlkfhlh727gj3y")', 
                    function(err){
                        should.not.exist(err);
                        var count = 2;
                        var complete = function(){ count--; if(count === 0) done(); };
                        datasource.query(
                            'select * from users where name = "ivan"', 
                            function(err, data){
                                var results = data.toArray();
                                results.length.should.equal(1);
                                complete();
                            }
                        );
                        datasource.query(
                            'select * from users where name = "jason"', 
                            function(err, data){
                                var results = data.toArray();
                                results.length.should.equal(1);
                                complete();
                            }
                        );
                    }
                );
            });
            
            it('retains previously inserted values', function(done){
                datasource.query(
                    'select * from users', 
                    function(err, data){
                        var results = data.toArray();
                        results.length.should.equal(9);
                        done();
                    }
                );
            });
            
        });
        
        describe('updates', function(){
            
            it('single rows with multiple values', function(done){
                datasource.query(
                    'update users set extra="number9", age=44 where name = "bob"', 
                    function(err){
                        should.not.exist(err);
                        datasource.query(
                            'select * from users where name = "bob"', 
                            function(err, data){
                                should.not.exist(err);
                                var results = data.toArray();
                                results.length.should.equal(1);
                                should.exist(results[0].extra);
                                results[0].extra.should.equal('number9');
                                results[0].age.should.equal(44);
                                done();
                            }
                        );
                    }
                );
            });
            
        });
        
        describe('deletes', function(){
            
            it('a single row', function(done){
                //datasource.log = console.log
                datasource.query(
                    'delete from users where name = "bob"', 
                    function(err){
                        should.not.exist(err);
                        datasource.query(
                            'select * from users where name = "bob"', 
                            function(err, data){
                                should.not.exist(err);
                                var results = data.toArray();
                                results.length.should.equal(0);
                                done();
                            }
                        );
                    }
                );
            });
            
        });
        
        describe('creates', function(){
            
            it('a single collection', function(done){
                //datasource.log = console.log
                datasource.query(
                    'create others', 
                    function(err){
                        datasource.query(
                            'insert into others (name, age, id) values ("edgar", 16, "djfuhf43b325nr7")', 
                            function(err){
                                should.not.exist(err);
                                datasource.query(
                                    'select * from others where name = "edgar"', 
                                    function(err, data){
                                        var results = data.toArray();
                                        results.length.should.equal(1);
                                        done();
                                    }
                                );
                            }
                        );
                    }
                );
            });
            
        });
        
    });
    
    describe('handles mongo/sift', function(){
        
        var datasource = new Mangrove({file:'testdata.json'});
        
        describe('selects', function(){
        
            it('a full set', function(done){
                datasource.query('users').find(function(err, data){
                    var results = data.toArray();
                    results.length.should.equal(6);
                    done();
                });
            });
            
            it('using a where clause with a bounded selection', function(done){
                datasource.query('users').find({
                    age : {$gt : 24}
                }, function(err, data){
                    var results = data.toArray();
                    results.length.should.equal(4);
                    done();
                });
            });
            
            it('using a where clause with a ranged selection', function(done){
                datasource.query('users').find({
                    age : {$gt : 24, $lt : 36}
                }, function(err, data){
                    var results = data.toArray();
                    results.length.should.equal(2);
                    done();
                });
            });
            
            it('an exact string value', function(done){
                datasource.query('users').find({
                    name : "roger"
                }, function(err, data){
                    var results = data.toArray();
                    results.length.should.equal(1);
                    done();
                });
            });
            
        });
        
        describe('inserts', function(){
            
            it('a single value which is then reselectable', function(done){
                datasource.query('users').insert({
                    name : "sherman",
                    age : 12,
                    id : "djfuhf73b327s09"
                }, function(err){
                    should.not.exist(err);
                    datasource.query('users').find({
                        name : "sherman"
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(1);
                        done();
                    });
                });
            });
            
            it('multiple values which are then reselectable', function(done){
                datasource.query('users').insert([
                    {
                        name : "ivan",
                        age : 23,
                        id : "kdsfh7sdy4jhveve"
                    },{
                        name : "jason",
                        age : 37,
                        id : "fsdlkfhlh727gj3y"
                    }
                ], function(err){
                    should.not.exist(err);
                    var count = 2;
                    var complete = function(){ count--; if(count === 0) done(); };
                    datasource.query('users').find({
                        name : "ivan"
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(1);
                        complete();
                    });
                    datasource.query('users').find({
                        name : "jason"
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(1);
                        complete();
                    });
                });

            });
            
            it('retains previously inserted values', function(done){
                datasource.query('users').find(function(err, data){
                    var results = data.toArray();
                    results.length.should.equal(9);
                    done();
                });
            });
            
        });
        
        describe('updates', function(){
            
            it('single rows with multiple values', function(done){
                datasource.query('users').update({
                    age : 44,
                    extra : "number9"
                },{
                    name : "bob"
                }, function(err){
                    should.not.exist(err);
                    datasource.query('users').find({
                        name : "bob"
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(1);
                        should.exist(results[0].extra);
                        results[0].extra.should.equal('number9');
                        results[0].age.should.equal(44);
                        done();
                    });
                });
            });
            
        });
        
        describe('deletes', function(){
            
            it('a single row', function(done){
                datasource.query('users').delete({
                    name : 'bob'
                }, function(err){
                    should.not.exist(err);
                    datasource.query('users').find({
                        name : 'bob'
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(0);
                        done();
                    });
                });
            });
            
        });
        
        describe('creates', function(){
            
            it('a single collection', function(done){
                
                datasource.query('others').insert({
                    name : "edgar",
                    age : 16,
                    id : "djfuhf43b325nr7"
                }, function(err){
                    should.not.exist(err);
                    datasource.query('others').find({
                        name : "edgar"
                    }, function(err, data){
                        should.not.exist(err);
                        var results = data.toArray();
                        results.length.should.equal(1);
                        done();
                    });
                });
                
            });
            
        });
        
    });
});