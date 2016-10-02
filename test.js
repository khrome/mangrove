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
        
    });
    
    /*describe('handles mongo/sift', function(){
        
    });*/
});