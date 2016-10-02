var should = require("should");
var request = require("request");
var Mangrove = require('./mangrove');

describe('Mangrove', function(){
    var datasource;
    
    before(function(){
        datasource = new Mangrove({file:'testdata.json'});
    });
    
    describe('handles SQL', function(){
        
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
        
    });
    
    /*describe('handles mongo/sift', function(){
        
    });*/
});