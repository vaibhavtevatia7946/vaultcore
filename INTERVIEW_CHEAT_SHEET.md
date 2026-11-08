# VaultCore: Technical Interview & Evaluation Defense Guide

This document contains the exact high-impact answers to the top 10 technical questions professors, external examiners, and engineering interviewers will ask about this project.

---

### Q1: "Give me a 30-second elevator pitch of what you built."
> *"I built VaultCore—a high-throughput, ACID-compliant distributed payment ledger. It models the core banking engine behind systems like Stripe and PhonePe. It eliminates race conditions and double-spending using row-level distributed locking, enforces idempotency to prevent duplicate charges on network retries, and maintains mathematical integrity via double-entry accounting with SHA-256 Merkle hash auditing."*

---

### Q2: "Why double-entry bookkeeping? Why not simply run `UPDATE accounts SET balance = balance - amount`?"
> *"Standard CRUD balance updates are dangerous in financial systems because they leave no immutable audit trail. If a balance drops from $1,000 to $900, you have no cryptographic proof of who debited it, when, or where it went. In VaultCore, balance is an immutable derivative of the ledger: for every transfer, exactly two entries are written (1 DEBIT and 1 CREDIT). The system enforces the fundamental banking theorem: $\sum \text{Credits} - \sum \text{Debits} = 0$. If there is even a 1-cent discrepancy, the audit engine flags a system integrity compromise."*

---

### Q3: "What is an Idempotency-Key and how did you implement it?"
> *"Network calls are unreliable. If a user clicks 'Pay $100' and their internet drops during the response phase, the client retries. Without idempotency, they get charged twice. In VaultCore, the client sends a unique UUID in the `Idempotency-Key` header. When received:
> 1. We mark the key as `IN_FLIGHT` in Redis.
> 2. If a duplicate arrives simultaneously, it is rejected with `409 Conflict`.
> 3. Once settled, we cache the transaction payload. Subsequent retries instantly return the original response with `X-Idempotent-Replay: true` without hitting the database or debiting funds again."*

---

### Q4: "How did you prevent Deadlocks during simultaneous cross-transfers?"
> *"If User A transfers to User B, and User B transfers to User A at the exact same millisecond: Thread 1 locks Account A and waits for Account B. Thread 2 locks Account B and waits for Account A. This creates Coffman's Circular Wait condition (Deadlock).
> To solve this, I implemented Dijkstra's Resource Ordering Algorithm: we sort the account IDs lexicographically before acquiring row locks (`min(ID_A, ID_B)` first, then `max(ID_A, ID_B)`). Because both threads are forced to acquire locks in the exact same sequence, circular wait is mathematically impossible."*

---

### Q5: "What database isolation level did you use and why?"
> *"We use `SERIALIZABLE` isolation combined with explicit `SELECT ... FOR UPDATE` row locks. While `READ COMMITTED` or `REPEATABLE READ` are faster, they permit phantom reads and write skew anomalies under high concurrency. In financial systems, strict consistency always trumps eventual consistency."*

---

### Q6: "How did you benchmark and test the system?"
> *"We built an automated test suite (`npm test`) covering unit tests, overdraft rejection, and idempotency replay. In addition, our Concurrency Lab fires 50+ simultaneous parallel workers executing cross-transfers with simulated network latencies. Across all stress runs, the system maintained 0 deadlocks and a mathematical audit delta of strictly $0.00."*

---

### Q7: "How is the ledger tamper-evident?"
> *"Each ledger entry contains a cryptographic SHA-256 hash computed over: `Hash = SHA256(PreviousEntryHash : TransactionId : Amount : AccountId : Timestamp)`. Similar to a Merkle tree or blockchain, modifying any historical record breaks the cryptographic chain of all subsequent records, immediately alerting auditors."*

---

### Q8: "If the application server crashes mid-transfer, what happens?"
> *"All operations execute inside an ACID database transaction. If the server dies before the final `COMMIT`, PostgreSQL automatically rolls back both balance deductions and ledger insertions. Furthermore, our background notifications (email receipts, webhooks) are decoupled into an asynchronous message queue (BullMQ/RabbitMQ) so network failures during notification delivery never roll back settled financial records."*
