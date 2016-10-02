Mangrove
========
This isn't quite ready for real use, but will be very soon!

A set manipulation datasource for storing, selecting and subselecting data, currently an excellent candidate for mocking a database during testing, replacing an in-memory instance of SQLLite or pointbase in simple use cases, doing dynamic analysis where preserving sets over time for resident datasets is desirable or data is continually in flux during analysis.

One of it's unique features is it's traversal based approach which reduces the overhead for copies of the set to ordering of the object's keys. This not only leads to tremendous memory savings in comparison to working with arrays, but allowing all instances inside all sets descended from the same collection to be working on a single set of items despite all the segmentation, mutation and subcreation. While traditional indexes may be layered on in the future, it will always be as a convenience and totally modular alternate traversal paths.

As it gets new features and a DB service, lots of use cases may arise.

Returned sets are instances of [indexed-set](https://www.npmjs.com/package/indexed-set) Sets, which you may then use to further analyze the results or just call `.toArray()` and get something more familiar.


		var datasource = new Mangrove({
			file:'data.json'
		});
		datasource.query(
            'select * from users where age > 24', 
            function(err, data){
                //data is an Indexed.Set
            }
        );                
 
 Testing
 -------
 To run test, just type
 
 		mocha
 		
 Enjoy,
 
 -Abbey Hawk Sparrow