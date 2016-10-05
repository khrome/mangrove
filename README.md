Mangrove
========
Mangrove is an in-memory database for working with high-speed ephemeral data, or performing ad-hoc analysis within an application. It supports multiple query languages, and most of the options you would expect from an ephemeral database.

I wouldn't use it in production just yet, but it should be perfectly servicable in simple test cases. As it gets new features and a DB service, lots of use cases may arise.

Why?
----
Mangrove has a number of unique features when compared to other datasources:

- **Lightweight Sets** : Mangrove is built on top of [indexed-set](https://www.npmjs.com/package/indexed-set), which stores only orderings of objects inside it's sets and only references the object collection during internal operations. That way you can have many copies of a set processing which would otherwise overload memory.
- **No Disk Access** : It keeps everything in memory, giving you memcache-like direct access speeds and mongo-like filter speeds.
- **Multiple Query Languages** : It allows [SQL](https://en.wikipedia.org/wiki/SQL) or [Mongo Query Documents](https://docs.mongodb.com/manual/crud/) syntaxes which are then mapped onto our lazily evaluated internal set filters.
- **Filter Centric** : all operations contribute to a stack of filters internal to the set, which allows incoming data to be correctly routed, and changes to be resolved, keeping the lightweight sets up-to-date with minimal work.
- **Native JS** : Because the entire stack is JS you can embed it inside a desktop app, a server app, on a mobile device, put it in a test script, ship it to the browser, run it as a service or embed it in your own service. Think of it like [pointbase](https://en.wikipedia.org/wiki/PointBase) but reimagined by users of [mongo](https://www.mongodb.com) and [redis](http://redis.io).
- **Persistent Sets** : Because it's cheap to make copies and subsets it's also easy to keep copies around for long-term interaction.


Usage
-----

Returned sets are instances of [indexed-set](https://www.npmjs.com/package/indexed-set) Sets, which you may then use to further analyze the results or just call `.toArray()` and get something more familiar.

###Using SQL

####Creating

	var datasource = new Mangrove({
		file:'data.json'
	});

####Selecting

	datasource.query(
        'select * from users where age > 24', 
        function(err, data){
            //data is an Indexed.Set
        }
    );

####Inserting

	datasource.query(
        'insert into users (age, name, value) values '+
        	'(20, "john", "dsjdfjdb832yg936"), '+
        	'(20, "paul", "dsjdsdsfmg2ygg26"), '+
        	'(19, "george", "ddfdfdb832yggr6"), '+
        	'(22, "richard", "fdjkdfhhir987ere")', 
        function(err){
        	//if(!err), everything went fine
        }
    );
    
####Updating

	datasource.query(
        'update users set name="ringo",likes="gardens" where id="fdjkdfhhir987ere"', 
        function(err){
            //if(!err), everything went fine
        }
    );

###Using Mongo Query Documents

[Coming Soon]

###Promises

If callbacks aren't your thing, just use the `.inquire(<query>)` function and you'll get the promises you crave.

 
 Upcoming Features
 -----------------
 
 **Soon**
 
 - sift support
 - Parenthetical Support
 - Specific returns(not just '*')
 - Implicit Joins
 - Service implementation (with client lib)
 - Sets Fully Live (.and/.or/.not/.xor directly manipulate, switch to filters)
 - Optional Domain wrappers in object
 - Set based event subscription 
 - Authentication
 - sharding collections via PAXOS (distributed processing and storage)
 - Transactions
 - Ordering and Grouping
 
  **Someday**
 
 - DB flushing (syncing to external datasources)
 - Mocks (replicas of DB clients for testing)
 	- mongo
 	- mysql
 	- SQLite
 	- postgres
 	- mondrian?
 - Indexes
 - pushing filterFns into external DB procedures
 - Pivot Table UI for the service.
 
 Testing
 -------
 To run test, just type
 
	mocha
 		
 Enjoy,
 
 -Abbey Hawk Sparrow