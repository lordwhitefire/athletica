# Analysis notes — goark/pa-api (working record)

Read in full: `auth.go`, `client.go`, `server.go`, `marketplace.go`, `operation.go`, `errcode.go`.
Sampled: `query/getitems.go`, `query/query.go`, `query/resources.go`, `query/request.go`, `client_test.go` (error tests), `README.md`.
Not read: entity (response structs), search/browse query files, date helpers.

Method: `Read` on files; one `grep` for retry/429/throttle/backoff/sleep in non-test Go files (no hits
beyond unrelated words). Nothing executed.

Open question carried to the report: how `github.com/goark/fetch` reports non-2xx replies from the
catalog call. Not in the sample, so `not proven`.
