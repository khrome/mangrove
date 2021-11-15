Upcoming Features
-----------------

The current major focus of this is to simplify generating and loading database configurations for testing. Once that use case is easy, it will expand to others.

**Soon™**

- Update Docs for streaming & client use
- hierarchical joins(unconditional, at first)
- Sets Fully Live (.and/.or/.not/.xor directly manipulate, switch to filters)
- cursor
- Sandboxing - Optional Domain wrappers in object
- Set pooling - ensuring duplicate queries only allocate 1 resource set
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
