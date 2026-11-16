# Plan — Rollout MVP in Six Layers

**Date:** 2026-10-24
**Status:** Draft v2 — awaiting the owner's answers to the scoping questions, then the owner's go

## What the owner asked for

A plan for the `rollout` app as the MVP, organized by six layers — UI, data model, business logic, functionality, user UX, system model — starting from the first users: people who click one of two backlinks and see a product.

## What I will produce

One plan document in `product-management/` with:

- the first-user journey: backlink → product page → Amazon;
- one section per layer: what exists now, what is missing, what the MVP needs, and what is explicitly out;
- the CIRCLES recommendation: the customer, the need that wins, the trade-off, and one testable success metric;
- assumptions and open research items.

## Method

CIRCLES makes the product calls. The six layers are the structure of the plan. The steps run in order and are not merged.

## Inputs

- The owner's answers to the scoping questions: the two backlinks, VX, launch constraint, product supply, Amazon account, success metric, admin operation, deployment.
- `athletica/rollout/` — the app as it exists now, read-only.
- `athletica/openspec/changes/roll-arch/` — the two-app plan and its tasks.
- `athletica/openspec/changes/athletica-architecture/` — the target architecture.

## Boundaries

- No code, configuration, deployment, or tickets.
- Write only inside `product-management/`.
- The recommendation is advice. The decision remains the owner's.

## Sequence

1. Comprehend — establish the goal, constraints, and context.
2. Identify — settle the first users and the stakeholder.
3. Report — name the underlying need behind the stated want.
4. Cut — choose the need that wins and state what is given up.
5. List — produce genuinely different MVP options.
6. Evaluate — weigh them against what matters now.
7. Summarize — one recommendation, one metric, and the reasoning.

## Stop point

The work ends when the plan and recommendation are handed back. Nothing is built, shipped, or changed by me.
