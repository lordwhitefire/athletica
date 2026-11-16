## Purpose

The repository holds two separate Next.js apps. `rollout/` is the Production app (the public showroom). `frontend/` is the Development app (the full football store and its office, not public). Isolation is structural, not a runtime switch. Both use one Supabase project: Production uses the `rollout` schema, Development uses `public`.

## ADDED Requirements

### Requirement: Two separate apps
The repository SHALL hold the Production app in `rollout/` and the Development app in `frontend/` as separate Next.js apps with separate build/runtime entry points. They SHALL NOT share a runtime environment switch.

#### Scenario: Separate apps
- **WHEN** the repository is built or run
- **THEN** `rollout/` and `frontend/` are independent apps

### Requirement: One Supabase project, two schemas
The system SHALL use one Supabase project. Production data SHALL live in the `rollout` schema (`rollout.products`, `rollout.analytics`); Development data SHALL live in `public`. There SHALL be no cross-schema queries.

#### Scenario: Production reads rollout only
- **WHEN** a Production page or service runs
- **THEN** it queries only the `rollout` schema

#### Scenario: Development reads public only
- **WHEN** a Development page or service runs
- **THEN** it queries only the `public` schema

### Requirement: Schema-scoped clients
Every Production Supabase client SHALL select the `rollout` schema explicitly (for example `createClient<Database, 'rollout'>(url, key, { db: { schema: 'rollout' } })`). Relying on the default `public` schema SHALL be treated as a defect.

#### Scenario: Client selects rollout
- **WHEN** a Production client is created
- **THEN** its queries carry the `rollout` schema, not the default `public`

### Requirement: No runtime environment switch
The system SHALL NOT use `NEXT_PUBLIC_SYSTEM_TYPE` or route-blocking middleware to choose a track. Isolation SHALL come from separate apps and schema-scoped data.

#### Scenario: No switch variable
- **WHEN** the Production app is configured
- **THEN** it does not read `NEXT_PUBLIC_SYSTEM_TYPE`

### Requirement: Production is the only public app
Only the Production app SHALL be deployed to the public domain. The Development app SHALL be local/private only. A Development-only route on the public domain SHALL 404 because the Production app does not contain it.

#### Scenario: Public domain serves Production
- **WHEN** a user visits the public domain
- **THEN** they see only Production surfaces

#### Scenario: Development route 404s
- **WHEN** a user opens a Development-only route on the public domain
- **THEN** the app returns 404

### Requirement: Development app is not exposed
The Development app SHALL NOT be publicly accessible. If deployed for the team, it SHALL be private/password-protected and SHALL NOT be the customer URL.

#### Scenario: Development is private
- **WHEN** the Development app is deployed
- **THEN** it is private and never linked from the Production app

### Requirement: Graduation path
The system SHALL support moving a feature from Development to Production: schema adaptation, data copy if needed, component swap, route/service update, testing, and deployment — without exposing the in-development feature to users prematurely.

#### Scenario: Feature graduates
- **WHEN** a Development feature is ready to ship
- **THEN** it is adapted into the Production app and becomes user-facing, without prematurely exposing unfinished work
