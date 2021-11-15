Mangrove
========
[![NPM version](https://img.shields.io/npm/v/mangrove.svg)](https://www.npmjs.com/package/mangrove)
[![npm](https://img.shields.io/npm/dt/mangrove.svg)]()
[![Travis](https://img.shields.io/travis/khrome/mangrove.svg)]()

Mangrove is an in-memory database for working with high-speed ephemeral data, or performing ad-hoc analysis within an application. It supports multiple query languages and most of the options you would expect from a database without authorization or transactions.

It can be a standalone DB in a test suite, a local DB in the browser, linked to another mangrove instance that acts as a data API, or embedded in multiple Electron windows all sharing a data context.

It has a number of unique features when compared to other datasources:

- **Lightweight Sets** : Mangrove is built on top of [indexed-set](https://www.npmjs.com/package/indexed-set), which stores only orderings of objects inside it's sets and only references the object collection during internal operations. That way you can have many copies of a set processing which would otherwise overload memory.
- **No Disk Access** : It keeps everything in memory, giving you memcache-like direct access speeds and mongo-like filter speeds.
- **Multiple Query Languages** : It allows [SQL](https://en.wikipedia.org/wiki/SQL) or [Mongo Query Documents](https://docs.mongodb.com/manual/crud/) queries which are then mapped onto lazily evaluated internal set filters, meaning: common performance characteristics, regardless of query type.
- **Filter Centric** : all operations contribute to a stack of filters internal to the set, which allows incoming data to be correctly routed, and changes to be resolved, keeping the lightweight sets up-to-date with minimal work.
- **Native JS** : Because the entire stack is JS you can embed it inside a desktop app, a server app, on a mobile device, put it in a test script, ship it to the browser, run it as a service or embed it in your own service. Think of it like [pointbase](https://en.wikipedia.org/wiki/PointBase) but reimagined by users of [mongo](https://www.mongodb.com) and [redis](http://redis.io).
- **Persistent Sets** : Because it's cheap to make copies and subsets it's also easy to keep copies around for long-term interaction.

All queries are parsed and restructured before execution or transmission, so you can finally use query languages in a client without worry, and it also allows you to mix and match your usage of query languages.

Usage
-----

`mangrove` supports two query syntaxes, which use a common structured execution format as well as allowing return by callback (⨍) or promise(🙏, which also enables await(⏱)).

<h3>Selecting</h3>
<table><tr><td colspan="2">

Returned sets are instances of [indexed-set](https://www.npmjs.com/package/indexed-set) Sets, which you may then use to further analyze the results or just call `.toArray()` and get something more familiar. It should be noted that all returned sets are 'live' and linked back to the data, so any edits mutate primary data, which is then *immediately* available for selection. When you are mutating the returned sets, you have access to all the internals powering the database.
</td></tr><tr><td valign="top">
<details><summary> SQL + ⨍ </summary><p>

```javascript
datasource.query(
    'select * from users where age > 24',
    function(err, data){
        //if !err data is an Indexed.Set
    }
);
```

</p></details></td><td valign="top">

<details><summary> QD + ⨍ </summary><p>

```javascript
datasource.query('users').find({
    age:{$gt:24}
}, function(err, data){
    //if !err data is an Indexed.Set
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + 🙏 </summary><p>

```javascript
datasource.inquire(
    'select * from users where age > 24'
).then((results)=>{
    //use results
}).error((err)=>{
    //handle error
})
```

</p></details></td><td valign="top">

<details><summary> QD + 🙏 </summary><p>

```javascript
datasource.inquire('users').find({
    age:{$gt:24}
}).then((results)=>{
    //use results
}).error((err)=>{
    //handle error
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + ⏱ </summary><p>

```javascript
let results = null;
try{
    results = await datasource.inquire(
        'select * from users where age > 24'
    );
    //use results
}catch(err){
    //handle err
}
```

</p></details></td><td valign="top">

<details><summary> QD + ⏱ </summary><p>

```javascript
let results = null;
try{
    results = await datasource.inquire('users').find({
        age:{$gt:24}
    });
    //use results
}catch(err){
    //handle err
}
```
</p></details></td></tr></table>
<h3>Inserting</h3>
<table><tr><td colspan="2">

You can insert data into a collection (which in Query Document mode automatically creates collections) by using standard syntaxes:
</td></tr><tr><td valign="top">
<details><summary> SQL + ⨍ </summary><p>

```javascript
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

</p></details></td><td valign="top">

<details><summary> QD + ⨍ </summary><p>

```javascript
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
}], function(err){
    //if !err data is an Indexed.Set
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + 🙏 </summary><p>

```javascript
datasource.inquire(
    'insert into users (age, name, value) values '+
    '(20, "john", "dsjdfjdb832yg936"), '+
    '(20, "paul", "dsjdsdsfmg2ygg26"), '+
    '(19, "george", "ddfdfdb832yggr6"), '+
    '(22, "richard", "fdjkdfhhir987ere")'
).then((results)=>{
    //use results
}).error((err)=>{
    //handle error
})
```

</p></details></td><td valign="top">

<details><summary> QD + 🙏 </summary><p>

```javascript
datasource.inquire('users').insert([{
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
}]).then(()=>{
    //things are saved
}).error((err)=>{
    //handle error
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + ⏱ </summary><p>

```javascript
try{
    await datasource.inquire(
        'insert into users (age, name, value) values '+
        '(20, "john", "dsjdfjdb832yg936"), '+
        '(20, "paul", "dsjdsdsfmg2ygg26"), '+
        '(19, "george", "ddfdfdb832yggr6"), '+
        '(22, "richard", "fdjkdfhhir987ere")'
    );
    //things are saved
}catch(err){
    //handle err
}
```

</p></details></td><td valign="top">

<details><summary> QD + ⏱ </summary><p>

```javascript
try{
    await datasource.inquire('users').insert([{
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
    }]);
    //things are saved
}catch(err){
    //handle err
}
```

</p></details></td></tr></table>

<h3>Updating</h3>
<table><tr><td colspan="2">

Updates are only useful for selective field updates, whole object updates can be handled by insert
</td></tr><tr><td valign="top">
<details><summary> SQL + ⨍ </summary><p>

```javascript
datasource.query(
    'update users set name="ringo",likes="gardens" where id="fdjkdfhhir987ere"',
    function(err, data){
        //if !err data is an Indexed.Set
    }
);
```

</p></details></td><td valign="top">

<details><summary> QD + ⨍ </summary><p>

```javascript
datasource.query('users').update({
    name : "ringo",
    likes : "gardens"
}, {
    id: "fdjkdfhhir987ere"
}, function(err, data){
    //if !err data is an Indexed.Set
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + 🙏 </summary><p>

```javascript
datasource.inquire(
    'update users set name="ringo",likes="gardens" where id="fdjkdfhhir987ere"'
).then((results)=>{
    //saved
}).error((err)=>{
    //handle error
})
```

</p></details></td><td valign="top">

<details><summary> QD + 🙏 </summary><p>

```javascript
datasource.inquire('users').update({
    name : "ringo",
    likes : "gardens"
}, {
    id: "fdjkdfhhir987ere"
}).then((results)=>{
    //saved
}).error((err)=>{
    //handle error
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + ⏱ </summary><p>

```javascript
let results = null;
try{
    results = await datasource.inquire(
        'update users set name="ringo",likes="gardens" where id="fdjkdfhhir987ere"'
    );
    //saved
}catch(err){
    //handle err
}
```

</p></details></td><td valign="top">

<details><summary> QD + ⏱ </summary><p>

```javascript
try{
    await datasource.inquire('users').update({
        name : "ringo",
        likes : "gardens"
    }, {
        id: "fdjkdfhhir987ere"
    });
    //saved
}catch(err){
    //handle err
}
```
</p></details></td></tr></table>

<h3>Deleting</h3>
<table><tr><td colspan="2">

You can delete any data by arbitrary criteria, which modify all instances in the database.
</td></tr><tr><td valign="top">
<details><summary> SQL + ⨍ </summary><p>

```javascript
datasource.query(
    'delete from users where name="stu"',
    function(err){
        //if(!err), everything went fine
    }
);
```

</p></details></td><td valign="top">

<details><summary> QD + ⨍ </summary><p>

```javascript
datasource.query('users').delete({
    name : "stu"
}, function(err){
    //if(!err), everything went fine
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + 🙏 </summary><p>

```javascript
datasource.inquire(
    'delete from users where name="stu"'
).then(()=>{
    //items are gone
}).error((err)=>{
    //handle error
})
```

</p></details></td><td valign="top">

<details><summary> QD + 🙏 </summary><p>

```javascript
datasource.inquire('users').delete({
    name : "stu"
}).then((results)=>{
    //items are gone
}).error((err)=>{
    //handle error
});
```

</p></details></td></tr></tr><tr><td valign="top">
<details><summary> SQL + ⏱ </summary><p>

```javascript
try{
    await datasource.inquire(
        'delete from users where name="stu"'
    );
    //items are gone
}catch(err){
    //handle err
}
```

</p></details></td><td valign="top">

<details><summary> QD + ⏱ </summary><p>

```javascript
try{
    await datasource.inquire('users').delete({
        name : "stu"
    });
    //items are gone
}catch(err){
    //handle err
}
```
</p></details></td></tr></table>


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

### Examples

#### Client
[TBD]

#### Node.js + Postgres
[TBD]

#### Client + Remote Mangrove
[TBD]

#### Electron
[TBD]

Why?
----
Much of modern application design is state monitoring of a dataset for a variety of customer contexts ('my friend tweeted!', 'I exited my current routed directions', 'The scale is over a capacity threshold') and rather than the complexity of development being in developing the business rules for the actual thing creating value... the bulk of the work is getting all the pieces in place to ask "What is the users current state?". Often the logic of the application is trivial, and the process of assembling this data tends to dictate overall application design.

I propose that **the vast majority of all application effort is wasted** because we reach into the database to load enough data to then test the state in application space. But *wait*, perhaps there's another way.... **Why not just install a monitor using a DB selector and wait for the data to roll in?**

That's what this is moving toward: The database interface reimagined as a stream monitor which caches enough data to satisfy it's current queries, recieves updates from upstream selectors and requests data from it's ancestors when needed.

Testing
-------
To run test, just type

    mocha

Enjoy,

 -Abbey Hawk Sparrow
