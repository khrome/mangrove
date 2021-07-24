Mangrove
========
[![NPM version](https://img.shields.io/npm/v/mangrove.svg)]()
[![npm](https://img.shields.io/npm/dt/mangrove.svg)]()
[![Travis](https://img.shields.io/travis/khrome/mangrove.svg)]()

Mangrove is an in-memory database for working with high-speed ephemeral data, or performing ad-hoc analysis within an application. It supports multiple query languages, and most of the options you would expect from a database without authorization or transactions.

I'm currently using it as a DB stub in test cases and simple analysis, but it is already useful in other contexts.

DataMesh
--------
If you zoom out to a Database's core functions, you have: Storage, Replication and Indexing. Acknowledging this (and inspired by [TokyoCabinet/tkrzw](https://en.wikipedia.org/wiki/Tkrzw)'s view of indexing and storage) I suddenly wanted a DB more concentrated on edge changes, where filters could live for days or weeks with little to no impact as the primary data would sit in-memory (this library was originally built when [Hana](https://en.wikipedia.org/wiki/SAP_HANA) was being developed) or in-stream. This manifested with this library, which... while implemented as a DB currently, has much wider uses as a fragmented datastore in a distributed system. So a DataMesh: `selects/subscribes data for downstream peers`, `synchronizes it's datastore with it's incoming stream` and eventually may support `indexing` (someday, when it supports data on disk, since the current in-memory scheme allows sets to be simple indexes by themselves)

Why?
----
Much of modern application design is state monitoring of a dataset for a variety of customer contexts ('my friend tweeted!', 'I exited my current routed directions', 'The scale is over a capacity threshold') and rather than the complexity of development being in developing the business rules for the actual thing creating value... the bulk of the work is getting all the pieces in place to ask "What is the users current state?". Often the logic of the application is trivial, and the process of assembling this data tends to dictate overall application design.

I propose that **the vast majority of all application effort is wasted** because we reach into the database to load enough data to then test the state in application space. But *wait*, perhaps there's another way.... **Why not just install a monitor using a DB selector and wait for the data to roll in?**

That's what this is moving toward: The database interface reimagined as a stream monitor which caches enough data to satisfy it's current queries, recieves updates from upstream selectors and requests data from it's ancestors when needed.

Even without the full design, it has a number of unique features when compared to other datasources:

- **Lightweight Sets** : Mangrove is built on top of [indexed-set](https://www.npmjs.com/package/indexed-set), which stores only orderings of objects inside it's sets and only references the object collection during internal operations. That way you can have many copies of a set processing which would otherwise overload memory.
- **No Disk Access** : It keeps everything in memory, giving you memcache-like direct access speeds and mongo-like filter speeds.
- **Multiple Query Languages** : It allows [SQL](https://en.wikipedia.org/wiki/SQL) or [Mongo Query Documents](https://docs.mongodb.com/manual/crud/) queries which are then mapped onto lazily evaluated internal set filters, meaning: common performance characteristics, regardless of query type.
- **Filter Centric** : all operations contribute to a stack of filters internal to the set, which allows incoming data to be correctly routed, and changes to be resolved, keeping the lightweight sets up-to-date with minimal work.
- **Native JS** : Because the entire stack is JS you can embed it inside a desktop app, a server app, on a mobile device, put it in a test script, ship it to the browser, run it as a service or embed it in your own service. Think of it like [pointbase](https://en.wikipedia.org/wiki/PointBase) but reimagined by users of [mongo](https://www.mongodb.com) and [redis](http://redis.io).
- **Persistent Sets** : Because it's cheap to make copies and subsets it's also easy to keep copies around for long-term interaction.


Usage
-----

Returned sets are instances of [indexed-set](https://www.npmjs.com/package/indexed-set) Sets, which you may then use to further analyze the results or just call `.toArray()` and get something more familiar. It should be noted that all returned sets are 'live' and linked back to the data, so any edits mutate primary data, which is then *immediately* available for selection. When you are mutating the returned sets, you have access to all the internals powering the database.

#### Creating an instance

    var datasource = new Mangrove({
        file:'data.json'
    });

### Using SQL

#### Selecting

    datasource.query(
        'select * from users where age > 24',
        function(err, data){
            //data is an Indexed.Set
        }
    );

##### Selecting: Columns

As a rule of thumb: **always select on '*'**

If you would like to get a specific set of columns back (for a more compact set), that is supported... however you must remember that in writing a custom set, you have now rendered the the set to a new set of objects, thus your result set will just be an object return. So that returns can be handled uniformly, these arrays have a .toArray() convenience function with returns themselves. Depending on the use case it's highly encouraged to return the full set, given that it will be even *less* memory that the truncated set. There are some cases (like stubbing databases) where you still want this behavior.
```js
    datasource.query(
        'select name, age from users',
        function(err, data){
            //data is an Array which is Indexed.Set compatible
        }
    );
```

#### Inserting
```js
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
```

#### Updating
```js
    datasource.query(
        'update users set name="ringo",likes="gardens" where id="fdjkdfhhir987ere"',
        function(err){
            //if(!err), everything went fine
        }
    );
```

#### Deleting
```js
    datasource.query(
        'delete from users where name="stu"',
        function(err){
            //if(!err), everything went fine
        }
    );
```

#### Creating
```js
    datasource.query(
        'create songwriters',
        function(err){
            //if(!err), everything went fine
        }
    );
```

### Using Mongo Query Documents

In this mode collections are implicitly created.

#### Selecting
```js
    datasource.query('users').find({
        age:{$gt:24}
    }, function(err, data){
        //data is an Indexed.Set
    });
```

#### Inserting
```js
    datasource.query('users').insert([{
        name : "john",
        age : 20,
        id: "dsjdfjdb832yg936"
    },{
        name : "paul",
        age : 20,
        id: "dsjdsdsfmg2ygg26"
    },{
        name : "george",
        age : 19,
        id: "ddfdfdb832yggr6"
    },{
        name : "richard",
        age : 22,
        id: "fdjkdfhhir987ere"
    }],function(err){
    //if(!err), everything went fine
    });
```

#### Updating
```js
    datasource.query('users').update({
        name : "ringo",
        likes : "gardens"
    }, {
        id: "fdjkdfhhir987ere"
    }, function(err){
        //if(!err), everything went fine
    });
```

#### Delete
```js
    datasource.query('users').delete({
        name : "stu"
    }, function(err){
        //if(!err), everything went fine
    });
```

### Promises/Await

If callbacks aren't your thing, just use the `.inquire(<query>)` function and you'll get the promises you crave.

##### Mongo - Promises
```js
    datasource.inquire('users').find({
        age:{$gt:24}
    }).then(function(data){
        //react to the successful return
    }).catch(function(err){
        //react to an error
    });
```

##### SQL - Promises
```js
    datasource.inquire(
        'select * from users where age > 24'
    ).then(function(data){
        //react to the successful return
    }).catch(function(err){
        //react to an error
    });
```

##### Mongo - Await
```js
    try{
        let data = datasource.inquire('users').find({
            age:{$gt:24}
        });
        //react to the successful return
    }catch(ex){
        //react to an error
    }
```

##### SQL - Await

```js
    try{
        let data = datasource.inquire('select * from users where age > 24');
        //react to the successful return
    }catch(ex){
        //react to an error
    }
```

### Server

There is experimental support for webservice access to the database... this will eventually be enhanced by client libraries optionally streaming a compressed format to each other.

For now the only supported interface is `POST`ing the SQL or QueryDocuments to the `/query` endpoint.

Just run

```bash
    mangrove server --port <port number> --collection <./path/to/data.json>
```

or (within the project)

    npm start

More to come.

### CLI Client

You can connect to local or remote services using the `mangrove client` command and use this [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) to examine the state of the collections or test queries. It supports both Query Documents and SQL (It will figure it out) and dumps the results to a simple ascii table.

```bash
    mangrove client --port <port number> --host <host>
```

Upcoming Features
-----------------

The current major focus of this is to simplify generating and loading database configurations for testing. Once that use case is easy, it will expand to others.

**Soon™**

- Parenthetical Support
- Implicit Joins (via lightweight "join sets" (n-way))
- Client Library (Usable as an ORM!)
- Sets Fully Live (.and/.or/.not/.xor directly manipulate, switch to filters)
- Optional Domain wrappers in object
- Set based event subscription
- inheritance across nodes (streaming between nodes/clusters)
    - intelligent query fragmentation for repeated use filters
    - fingerprints queryFn, loosely attaches those to nodes
            - memory problem
                - push more filters up from the leaves
                - shard within a cluster
            - throughput problem
                - push more filters down from the root
                - shard clusters
- sharding collections (clustering - PAXOS)

*Core Finished*

---

- Authentication
- Transactions
- Ordering and Grouping

**Someday**

- DB flushing (syncing to external datasources)
- Mocks (replicas of DB clients for testing)
     - mongo
     - mysql
     - SQLite
     - postgres
     - more...
- Indexes
- pushing filterFns into external DB procedures(where supported)
- Pivot Table UI for the service.

Testing
-------
To run test, just type

    mocha

Enjoy,

 -Abbey Hawk Sparrow
