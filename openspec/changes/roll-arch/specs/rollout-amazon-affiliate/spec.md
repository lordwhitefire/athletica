## Purpose

The Rollout Amazon Affiliate Service derives the affiliate destination URL from a product's stored ASIN plus server-side affiliate configuration, at click time, in the backend. It does not store generated URLs permanently and it does not live in the frontend. The Production app uses it through the `GET /go/:id` redirect route.

## ADDED Requirements

### Requirement: Affiliate URL derivation
The system SHALL derive the Amazon affiliate destination from a product's ASIN plus affiliate configuration, in the backend, at click time. The service SHALL expose a function to get the affiliate URL for a product id. The configuration SHALL come from `AMAZON_ASSOCIATES_TAG` and `AMAZON_STORE`; there SHALL be no hardcoded tag.

#### Scenario: Derive on demand
- **WHEN** the backend gets a request to generate the affiliate URL for a product
- **THEN** it derives the destination from the stored ASIN and affiliate configuration

#### Scenario: No product / no ASIN
- **WHEN** a product has no record or no ASIN
- **THEN** the service reports that no affiliate destination can be derived

#### Scenario: Missing or placeholder configuration
- **WHEN** the Amazon tag or store is missing, empty, or a placeholder
- **THEN** the service reports that no affiliate destination can be derived and does not build a URL

### Requirement: Affiliate URL not stored
The system SHALL NOT permanently store the generated affiliate URL on the product record. Only the ASIN is stored; the URL is derived.

#### Scenario: ASIN stored, URL derived
- **WHEN** a product record is inspected
- **THEN** it contains the ASIN but not a permanently stored generated affiliate URL

### Requirement: Backend responsibility
The affiliate generator SHALL live in the backend, not as a separate infrastructure service in Rollout 1. The frontend SHALL navigate to `GET /go/:id?source=...` when the customer clicks SHOP PRODUCT and SHALL NOT call `window.open`, request an affiliate URL, or construct Amazon URLs itself. The client component SHALL NOT receive the ASIN.

#### Scenario: Frontend navigates, backend derives
- **WHEN** a customer clicks SHOP PRODUCT
- **THEN** the browser navigates to `/go/:id`, and the backend derives the URL and redirects; the frontend never constructs the Amazon URL

### Requirement: Affiliate configuration
The system SHALL read the affiliate configuration from server-side environment variables (`AMAZON_ASSOCIATES_TAG`, `AMAZON_STORE`) and validate it before building a URL. A missing, empty, or placeholder value SHALL produce no URL.

#### Scenario: Configuration feeds derivation
- **WHEN** the backend derives an affiliate URL
- **THEN** it uses the configured tag and store plus the ASIN

#### Scenario: Placeholder is not real
- **WHEN** the configured tag is a placeholder such as `athletica-20`
- **THEN** the service treats it as missing and produces no URL

### Requirement: No open redirects
`/go/:id` SHALL redirect only to the configured Amazon host with the configured tag. It SHALL NOT accept an arbitrary destination URL.

#### Scenario: Arbitrary destination rejected
- **WHEN** a request tries to supply a foreign destination
- **THEN** the route ignores it and uses only the configured Amazon host and tag

### Requirement: Click recording
`/go/:id` SHALL record a click before redirecting. The redirect SHALL happen even if analytics recording fails.

#### Scenario: Click recorded then redirect
- **WHEN** a customer reaches `/go/:id` for an available product
- **THEN** a click is recorded with the product, source, and daily `visitor_hash`, and the browser is redirected to Amazon

#### Scenario: Analytics failure still redirects
- **WHEN** the click insert fails
- **THEN** the redirect to Amazon still happens
