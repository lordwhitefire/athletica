# Scope — Engagement 08, Sample: goark/pa-api

**Date:** 2026-11-16
**Engagement:** 08 — Amazon Creators API client behaviour (auth, token cache, marketplace routing, requests, errors)
**Sample slug:** goark-pa-api
**Mode:** A — open-source RE under licence, static only

## 1. The target

`github.com/goark/pa-api` — a Go client library for the Amazon Creators API (the repo was
originally a PA-API 5.0 client and has been migrated). Commit analysed:
`60cfe0145252ca17586e39f4d0d43d64a68d8057` (2026-05-12). 1,912 lines of Go including tests.

Local path (not committed): `reverse-engineering-workspace/samples/pa-api/`

## 2. The question

Our blueprint is built on PA-API 5.0 (SigV4 auth, `webservices.amazon.com`). Amazon's own page
says PA-API 5 is deprecated and returns HTTP 403 `AccessDeniedException`. This engagement asks:

1. How does a working Creators API client authenticate and cache tokens?
2. How is the marketplace chosen and sent?
3. What does a request look like (endpoint, headers, body, resources)?
4. How are errors and rate limits handled?
5. Which parts of the client are sound, and which are mistakes or gaps?

## 3. Ownership basis (mode A — Apache-2.0)

| Field | Value |
|---|---|
| Licence | Apache License 2.0 (`LICENSE`) |
| Permission basis | Apache-2.0 permits use, study, modification, distribution. We exercise *study*. |
| What we extract | Rules and behaviour: auth flow, token lifetime, header names, marketplace map, error handling. |
| What we will NOT do | Copy Go source into our build. Run, build or `go get` the library. Call Amazon. |

## 4. Allowed actions

Static analysis only (`rg`, `Read`). No execution, no network calls to Amazon, no modifying the clone.

## 5. Stop conditions

Stop if a rule cannot be backed by `file:line`, or if copying code would be needed.

## 6. Approver

Owner: `lordwhitefire` — approved plan with "start" on 2026-11-16.
